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

function PassportHolder() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [selectedStaffHead, setSelectedStaffHead] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
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

  // Fetch staff options for transfer
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/staff-heads');
        if (Array.isArray(res.data)) {
          const options = res.data.map(staff => ({
            label: staff.name,
            value: staff._id
          }));
          setStaffOptions(options);
        } else {
          toast.warn('No staff heads available');
        }
      } catch (err) {
        console.error('Error fetching staff heads:', err);
        toast.error('Failed to load staff heads');
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [lazyParams]);

  const fetchLeads = () => {
    setLoading(true);
    const { page, rows: limit, search } = lazyParams;

    axios.get(`http://localhost:5000/api/contact/get-passport-holder-leads/${CallingTeamId}`, {
      params: { page, limit, search }
    })
      .then((res) => {
        const leadsData = Array.isArray(res.data) ? res.data : res.data.leads || [];
        const total = Array.isArray(res.data) ? res.data.length : res.data.total || leadsData.length;

        setLeads(leadsData);
        setTotalRecords(total);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching leads:', err);
        setLeads([]);
        setTotalRecords(0);
        setLoading(false);
        toast.error('Failed to load leads');
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

  const onSearch = (e) => {
    const value = e.target.value;
    setLazyParams({
      ...lazyParams,
      search: value,
      first: 0,
      page: 1
    });
  };

  const handlePaymentBook = (phone) => {
    navigate('/payment-book', { state: { phone } });
  };

  const openStatusDialog = (lead) => {
    setSelectedLead(lead);
    setPassportNumber(lead.passportNumber || '');
    setShowStatusDialog(true);
  };

  const openTransferDialog = () => {
    if (selectedLeads.length === 0) {
      toast.warn('Please select at least one lead to transfer');
      return;
    }
    setShowTransferDialog(true);
  };

  const savePassportInfo = () => {
    if (!selectedLead) return;

    if (!passportNumber.trim()) {
      toast.warn('Please enter a passport number');
      return;
    }

    const updateData = {
      status: 'Passport Holder',
      passportNumber: passportNumber.trim()
    };

    axios.put(`http://localhost:5000/api/contact/update-lead-status/${selectedLead._id}`, updateData)
      .then(() => {
        fetchLeads();
        setShowStatusDialog(false);
        setPassportNumber('');
        toast.success('Passport information updated successfully');
      })
      .catch((err) => {
        console.error('Error updating passport info:', err);
        toast.error('Failed to update passport information');
      });
  };

  const transferLeads = async () => {
    if (!selectedStaffHead) {
      toast.warn('Please select a staff head');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/client-form/transfer', {
        leadIds: selectedLeads.map(lead => lead._id),
        transferredBy: CallingTeamId,
        transferredTo: selectedStaffHead,
      });

      toast.success(response.data.message || 'Leads transferred successfully');
      fetchLeads();
      setSelectedLeads([]);
      setSelectedStaffHead(null);
      setShowTransferDialog(false);
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(error.response?.data?.message || 'Failed to transfer leads');
    }
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

  const passportTemplate = (rowData) => {
    return (
      <span>{rowData.passportNumber || 'N/A'}</span>
    );
  };

  const actionTemplate = (rowData) => (
    <div className="leads-action-buttons">
      {/* Payments Book button */}
      <Button
        label="Payments Book"
        className="p-button-success p-button-sm leads-call-btn"
        onClick={() => handlePaymentBook(rowData)}
      />

      {/* Passport condition */}
      {!rowData.passportNumber && (
        <Button
          label="Add Passport"
          className="p-button-warning p-button-sm leads-edit-btn"
          onClick={() => openStatusDialog(rowData)}
        />
      )}

      {/* Form related buttons */}
      {rowData.status === "Passport Holder" && !rowData.isFormFilled ? (
        <Button
          label="Fill Form"
          className="p-button-info p-button-sm leads-form-btn"
          onClick={() => navigate(`/form`, { state: { leadId: rowData._id } })}
        />
      ) : rowData.status === "Passport Holder" && rowData.isFormFilled ? (
        <Button
          label="View"
          className="p-button-help p-button-sm leads-form-btn"
          onClick={() =>
            navigate(`/view-form`, { state: { leadId: rowData._id } })
          }
        />
      ) : null}
    </div>
  );

  const phoneTemplate = (rowData) => (
    <div className="leads-phone-cell">
      <span>{rowData.number}</span>
    </div>
  );

  const MobileCardView = ({ lead, index, selected, onSelect }) => (
    <div className={`leads-mobile-lead-card ${selected ? "selected-lead" : ""}`}>
      <div className="leads-card-header">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(lead)}
          className="leads-checkbox"
        />
        <div className="leads-lead-number">#{index + 1}</div>
        <Badge
          value={lead.status || "NA"}
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
          <span className="leads-value">{lead.zone?.zoneName || "N/A"}</span>
        </div>
        <div className="leads-info-row">
          <span className="leads-label">Assigned By:</span>
          <span className="leads-value">{lead.AssignedBy?.name || "N/A"}</span>
        </div>
        <div className="leads-info-row">
          <span className="leads-label">Date:</span>
          <span className="leads-value">
            {lead.AssignedDate
              ? new Date(lead.AssignedDate).toLocaleDateString()
              : "N/A"}
          </span>
        </div>
        <div className="leads-info-row">
          <span className="leads-label">Passport:</span>
          <span className="leads-value">{lead.passportNumber || "N/A"}</span>
        </div>
      </div>

      <div className="leads-card-actions">
        {/* Call Button */}
        <Button
          icon="pi pi-phone"
          className="p-button-rounded p-button-success p-button-sm leads-action-btn-mobile"
          onClick={() => handleCall(lead.number)}
        />

        {/* Passport condition */}
        {!lead.passportNumber && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-warning p-button-sm leads-action-btn-mobile"
            onClick={() => openStatusDialog(lead)}
          />
        )}

        {/* Form buttons */}
        {lead.status === "Passport Holder" && !lead.isFormFilled ? (
          <Button
            icon="pi pi-file-edit"
            className="p-button-rounded p-button-info p-button-sm leads-action-btn-mobile"
            onClick={() => navigate(`/form`, { state: { leadId: lead._id } })}
          />
        ) : lead.status === "Passport Holder" && lead.isFormFilled ? (
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-help p-button-sm leads-action-btn-mobile"
            onClick={() => navigate(`/view-form`, { state: { leadId: lead._id } })}
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="leads-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="leads-header">
        <h2>Passport Holder Leads</h2>
        <div className="leads-header-actions">
          {!isMobile && (
            <span className="p-input-icon-left">
              <InputText
                value={lazyParams.search}
                onChange={onSearch}
                placeholder="Search leads..."
              />
            </span>
          )}
          <Button
            label={isMobile ? "" : "Transfer"}
            icon="pi pi-users"
            className="p-button-secondary"
            onClick={openTransferDialog}
            disabled={selectedLeads.length === 0}
            tooltip={isMobile ? "Transfer Selected" : null}
          />
        </div>
      </div>

      {loading ? (
        <div className="leads-loading-container">
          <ProgressSpinner />
        </div>
      ) : leads.length === 0 ? (
        <div className="leads-no-leads">
          <i className="pi pi-info-circle"></i>
          <p>{lazyParams.search ? 'No leads match your search.' : 'No passport holder leads found.'}</p>
        </div>
      ) : isMobile ? (
        <div className="leads-mobile-leads-container">
          <div className="leads-mobile-search">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={lazyParams.search}
                onChange={onSearch}
                placeholder="Search leads..."
              />
            </span>
          </div>

          {leads.map((lead, index) => (
            <MobileCardView
              key={lead._id || index}
              lead={lead}
              index={index}
              selected={selectedLeads.some(l => l._id === lead._id)}
              onSelect={(lead) => {
                const isSelected = selectedLeads.some(l => l._id === lead._id);
                if (isSelected) {
                  setSelectedLeads(selectedLeads.filter(l => l._id !== lead._id));
                } else {
                  setSelectedLeads([...selectedLeads, lead]);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="leads-desktop-table-container">
          <DataTable
            value={leads}
            selection={selectedLeads}
            onSelectionChange={(e) => setSelectedLeads(e.value)}
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
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            <Column header="Sr No" body={(rowData, { rowIndex }) => rowIndex + 1} />
            <Column
              header="Zone"
              body={(rowData) => rowData.zone?.zoneName || 'N/A'}
            />
            <Column field="number" header="Phone Number" body={phoneTemplate} />
            <Column header="Passport Number" body={passportTemplate} />
            <Column header="Status" body={statusTemplate} />
            <Column header="Actions" body={actionTemplate} headerStyle={{ width: '3rem' }} />
          </DataTable>
        </div>
      )}

      {/* Passport Number Dialog */}
      <Dialog
        header="Add Passport Information"
        visible={showStatusDialog}
        style={{ width: '400px' }}
        onHide={() => {
          setShowStatusDialog(false);
          setPassportNumber('');
        }}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setShowStatusDialog(false);
                setPassportNumber('');
              }}
              className="p-button-text"
            />
            <Button
              label="Save"
              icon="pi pi-check"
              onClick={savePassportInfo}
              autoFocus
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="passportNumber">Passport Number</label>
            <InputText
              id="passportNumber"
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value)}
              placeholder="Enter Passport Number"
              className="mt-2"
            />
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

      {/* Transfer Leads Dialog */}
      <Dialog
        header="Transfer Selected Leads"
        visible={showTransferDialog}
        style={{ width: '400px' }}
        onHide={() => {
          setShowTransferDialog(false);
          setSelectedStaffHead(null);
        }}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setShowTransferDialog(false);
                setSelectedStaffHead(null);
              }}
              className="p-button-text"
            />
            <Button
              label="Transfer"
              icon="pi pi-check"
              onClick={transferLeads}
              disabled={!selectedStaffHead}
              autoFocus
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <p>Transferring {selectedLeads.length} lead(s)</p>
            <label htmlFor="staffHead">Staff Head</label>
            <Dropdown
              id="staffHead"
              value={selectedStaffHead}
              options={staffOptions}
              onChange={(e) => setSelectedStaffHead(e.value)}
              placeholder="Select a staff head"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default PassportHolder;