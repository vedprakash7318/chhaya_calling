import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { InputText } from 'primereact/inputtext';
import { useMediaQuery } from 'react-responsive';
import axios from 'axios';
import '../CSS/Leads.css';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1,
    sortField: null,
    sortOrder: null,
    search: ''
  });

  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const CallingTeamId = localStorage.getItem('CallingTeamId');

  // Separate useEffect to trigger fetchLeads when lazyParams change
  useEffect(() => {
    fetchLeads();
  }, [lazyParams]); // This will trigger whenever lazyParams changes

  const statusOptions = [
    { label: 'Interested', value: 'Interested' },
    { label: 'Not Interested', value: 'Not Interested' },
    { label: 'Passport Holder', value: 'Passport Holder' },
    { label: 'Client', value: 'Client' },
    { label: 'Agent', value: 'Agent' }
  ];

  const fetchLeads = () => {
    setLoading(true);
    const { page, rows: limit, search } = lazyParams;

    axios.get(`http://localhost:5000/api/contact/get-assigned-leads/${CallingTeamId}`, {
      params: { page, limit, search }
    })
      .then((res) => {
        setLeads(res.data.leads || []);
        setTotalRecords(res.data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching leads:', err);
        setLeads([]);
        setTotalRecords(0);
        setLoading(false);
      });
  };

  const onPage = (event) => {
    setLazyParams({
      ...lazyParams,
      first: event.first,
      rows: event.rows,
      page: event.page + 1
    });
  };

  // Enhanced search function with debouncing
  const onSearch = (e) => {
    const value = e.target.value;
    setLazyParams({
      ...lazyParams,
      search: value,
      first: 0,
      page: 1
    });
  };

  // Alternative: Add debounced search for better performance
  const [searchTimeout, setSearchTimeout] = useState(null);

  const onSearchDebounced = (e) => {
    const value = e.target.value;

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout
    const newTimeout = setTimeout(() => {
      setLazyParams({
        ...lazyParams,
        search: value,
        first: 0,
        page: 1
      });
    }, 500); // 500ms delay

    setSearchTimeout(newTimeout);
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleCall = (phone) => {
    window.open(`tel:${phone}`);
  };

  const openStatusDialog = (lead) => {
    setSelectedLead(lead);
    setSelectedStatus(lead.status || null);
    setPassportNumber(lead.passportNumber || ''); // Load existing passport number
    setShowStatusDialog(true);
  };

  const saveStatus = () => {
    if (!selectedStatus || !selectedLead) return;

    // Prepare update data
    const updateData = {
      status: selectedStatus
    };

    // Only include passport number if it's provided and status is Passport Holder
    if (selectedStatus === 'Passport Holder' && passportNumber.trim()) {
      updateData.passportNumber = passportNumber.trim();
    } else if (selectedStatus === 'Passport Holder' && !passportNumber.trim()) {
      toast.warn('Passport number is required when status is "Passport Holder"');
      return;
    }

    axios.put(`http://localhost:5000/api/contact/update-lead-status/${selectedLead._id}`, updateData)
      .then(() => {
        fetchLeads();
        setShowStatusDialog(false);
        setPassportNumber(''); // Clear passport number
        toast.success('Status updated successfully');
      })
      .catch((err) => {
        console.error('Error updating status:', err);
        toast.error('Failed to update status');
      });
  };

  const getStatusSeverity = (status) => {
    switch (status) {
      case 'Interested': return 'success';
      case 'Not Interested': return 'danger';
      case 'Passport Holder': return 'info';
      case 'Client': return 'success';
      case 'Agent': return 'warning';
      default: return 'secondary';
    }
  };

  const statusTemplate = (rowData) => {
    return (
      <Badge
        value={rowData.status || 'NA'}
        severity={getStatusSeverity(rowData.status)}
        className="leads-status-badge"
      />
    );
  };

  const actionTemplate = (rowData) => (
    <div className="leads-action-buttons">
      <Button
        label="Call"
        className="p-button-success p-button-sm leads-call-btn"
        onClick={() => handleCall(rowData.number)}
      />
      <Button
        label="Edit Status"
        className="p-button-warning p-button-sm leads-edit-btn"
        onClick={() => openStatusDialog(rowData)}
      />
    </div>
  );

  const phoneTemplate = (rowData) => (
    <div className="leads-phone-cell">
      <span>{rowData.number}</span>
    </div>
  );

  const MobileCardView = ({ lead, index }) => (
    <div className="leads-mobile-lead-card">
      <div className="leads-card-header">
        <div className="leads-lead-number">#{index + 1}</div>
        <Badge
          value={lead.status || 'NA'}
          severity={getStatusSeverity(lead.status)}
          className="leads-status-badge-mobile"
        />
      </div>

      <div className="leads-card-content">
        <div className="leads-info-row">
          <span className="leads-label">Mobile:</span>
          <span className="leads-value">{lead.number}</span>
        </div>
        <div className="leads-info-row">
          <span className="leads-label">Zone:</span>
          <span className="leads-value">{lead.zone?.zoneName || 'N/A'}</span>
        </div>
        <div className="leads-info-row">
          <span className="leads-label">Assigned By:</span>
          <span className="leads-value">{lead.AssignedBy?.name || 'N/A'}</span>
        </div>
        <div className="leads-info-row">
          <span className="leads-label">Date:</span>
          <span className="leads-value">
            {lead.AssignedDate ? new Date(lead.AssignedDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        {lead.passportNumber && (
          <div className="leads-info-row">
            <span className="leads-label">Passport:</span>
            <span className="leads-value">{lead.passportNumber}</span>
          </div>
        )}
      </div>

      <div className="leads-card-actions">
        <Button
          icon="pi pi-phone"
          className="p-button-rounded p-button-success p-button-sm leads-action-btn-mobile"
          onClick={() => handleCall(lead.number)}
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm leads-action-btn-mobile"
          onClick={() => openStatusDialog(lead)}
        />
      </div>
    </div>
  );

  return (
    <div className="leads-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="leads-header">
        <h2>Assigned Leads</h2>
        <div className="leads-header-actions">
          {!isMobile && (
            <span className="p-input-icon-left">
              <InputText
                value={lazyParams.search}
                onChange={onSearchDebounced} // Use debounced version for better performance
                placeholder="Search leads..."
              />
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="leads-loading-container">
          <ProgressSpinner />
        </div>
      ) : isMobile ? (
        <div className="leads-mobile-leads-container">
          <div className="leads-mobile-search">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={lazyParams.search}
                onChange={onSearchDebounced} // Use debounced version here too
                placeholder="Search leads..."
              />
            </span>
          </div>

          {leads.length > 0 ? (
            leads.map((lead, index) => (
              <MobileCardView
                key={lead._id || index}
                lead={lead}
                index={index}
              />
            ))
          ) : (
            <div className="leads-no-leads">
              <i className="pi pi-info-circle"></i>
              <p>{lazyParams.search ? 'No leads match your search.' : 'No leads have been assigned yet.'}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="leads-desktop-table-container">
          <DataTable
            value={leads}
            dataKey="_id"
            lazy
            paginator
            rows={lazyParams.rows}
            totalRecords={totalRecords}
            first={lazyParams.first}
            onPage={onPage}
            loading={loading}
            className="leads-custom-datatable"
            stripedRows
            responsiveLayout="scroll"
            emptyMessage="No leads found."
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          >
            <Column
              header="Sr No"
              body={(rowData, { rowIndex }) => rowIndex + 1}
              className="leads-srno-column"
            />
            <Column
              field="number"
              header="Phone Number"
              body={phoneTemplate}
              className="leads-phone-column"
            />
            <Column
              header="Zone"
              body={(rowData) => (
                <span className="leads-zone-cell">
                  <i className="pi pi-map-marker"></i>
                  {rowData.zone?.zoneName || 'N/A'}
                </span>
              )}
            />
            <Column
              header="Passport Number"
              body={(rowData) => (
                <span className="leads-passport-cell">
                  {rowData.passportNumber || 'N/A'}
                </span>
              )}
            />
            <Column
              header="Status"
              body={statusTemplate}
              className="leads-status-column"
            />
            <Column
              header="Actions"
              body={actionTemplate}
              className="leads-actions-column"
            />
          </DataTable>
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog
        header="Update Lead Status"
        visible={showStatusDialog}
        style={{ width: '400px' }}
        onHide={() => {
          setShowStatusDialog(false);
          setPassportNumber('');
        }}
        className="leads-status-dialog"
        footer={
          <div className="leads-dialog-footer">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setShowStatusDialog(false);
                setPassportNumber('');
              }}
              className="p-button-text p-button-secondary"
            />
            <Button
              label="Save"
              icon="pi pi-check"
              onClick={saveStatus}
              className="p-button-primary"
              autoFocus
            />
          </div>
        }
      >
        <div className="leads-dialog-content">
          <div className="leads-field">
            <label htmlFor="status">Select Status:</label>
            <Dropdown
              id="status"
              value={selectedStatus}
              options={statusOptions}
              onChange={(e) => setSelectedStatus(e.value)}
              placeholder="Select a status"
              className="w-full leads-status-dropdown"
            />
            {selectedStatus === 'Passport Holder' && (
              <>
                <label htmlFor="passportNumber" style={{ marginTop: "10px", display: "block" }}>Passport Number *</label>
                <InputText
                  id="passportNumber"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="Enter Passport Number"
                  className="mt-2"
                />
              </>
            )}
            {selectedStatus !== 'Passport Holder' && passportNumber && (
              <>
                <label htmlFor="passportNumber" style={{ marginTop: "10px", display: "block" }}>Passport Number (Optional)</label>
                <InputText
                  id="passportNumber"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="Enter Passport Number"
                  className="mt-2"
                />
              </>
            )}
          </div>
          {selectedLead && (
            <div className="p-field mt-3">
              <small className="p-text-secondary">
                Lead: {selectedLead.number}
              </small>
            </div>
          )}
        </div>
      </Dialog>


    </div>
  );
}

export default Leads;