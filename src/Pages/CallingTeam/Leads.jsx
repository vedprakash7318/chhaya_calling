import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { InputText } from 'primereact/inputtext';
import { SplitButton } from 'primereact/splitbutton';
import { useMediaQuery } from 'react-responsive';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import '../CSS/Leads.css';
import Notes from '../../Components/Notes';
import ShowNotes from '../../Components/ShowNotes'

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenShow, setIsModalOpenShow] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [addedById, setaddedById] = useState("");
  const APi_URL= import.meta.env.VITE_API_URL;
  const [notesData, setNotesData] = useState({
    addedBy: '',
    addedByType: '',
    leadId: ''
  });

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1,
    sortField: null,
    sortOrder: null,
    search: '',
    status: 'all'
  });

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const CallingTeamId = localStorage.getItem('CallingTeamId');

  const filterStatusOptions = useMemo(() => [
    { label: 'All Statuses', value: 'all' },
    { label: 'Interested', value: 'Interested' },
    { label: 'Not Interested', value: 'Not Interested' },
    { label: 'Passport Holder', value: 'Passport Holder' },
    { label: 'Client', value: 'Client' },
    { label: 'Agent', value: 'Agent' }
  ], []);

  const statusOptions = useMemo(() => [
    { label: 'Interested', value: 'Interested' },
    { label: 'Not Interested', value: 'Not Interested' },
    { label: 'Passport Holder', value: 'Passport Holder' },
    { label: 'Client', value: 'Client' },
    { label: 'Agent', value: 'Agent' }
  ], []);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const { page, rows: limit, search, status } = lazyParams;

    axios.get(`${APi_URL}/api/contact/get-assigned-leads/${CallingTeamId}`, {
      params: {
        page,
        limit,
        search,
        status: status === 'all' ? '' : status
      }
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
  }, [lazyParams, CallingTeamId]);

  const onPage = (event) => {
    setLazyParams(prev => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: event.page + 1
    }));
  };

  const onSearch = (e) => {
    const value = e.target.value;
    setLazyParams(prev => ({
      ...prev,
      search: value,
      first: 0,
      page: 1
    }));
  };

  const onStatusFilter = (e) => {
    setLazyParams(prev => ({
      ...prev,
      status: e.value,
      first: 0,
      page: 1
    }));
  };

  const clearFilters = () => {
    setLazyParams(prev => ({
      ...prev,
      search: '',
      status: 'all',
      first: 0,
      page: 1
    }));
  };

  const handleCall = (phone) => {
    window.open(`tel:${phone}`);
  };

  const openStatusDialog = (lead) => {
    setSelectedLead(lead);
    setSelectedStatus(lead.status || null);
    setPassportNumber(lead.passportNumber || '');
    setShowStatusDialog(true);
  };

  const handleOpenModal = (rowData) => {
    const addedBy = localStorage.getItem("CallingTeamId");
    const addedByType = "CallingTeam";
    const leadId = rowData._id;
    
    setNotesData({
      addedBy,
      addedByType,
      leadId
    });
    setIsModalOpen(true);
  };

  const handleOpenModalShow = (rowData) => {
    const addedBy = localStorage.getItem("CallingTeamId");
    const leadId = rowData._id;
    setaddedById(addedBy)
    setLeadId(leadId)
    setIsModalOpenShow(true);
  };

  const handleCloseModalShow = () => {
    setIsModalOpenShow(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNotesData({
      addedBy: '',
      addedByType: '',
      leadId: ''
    });
  };

  const saveStatus = () => {
    if (!selectedStatus || !selectedLead) return;

    const updateData = {
      status: selectedStatus
    };

    if (selectedStatus === 'Passport Holder' && passportNumber.trim()) {
      updateData.passportNumber = passportNumber.trim();
    } else if (selectedStatus === 'Passport Holder' && !passportNumber.trim()) {
      toast.warn('Passport number is required when status is "Passport Holder"');
      return;
    }

    axios.put(`${APi_URL}/api/contact/update-lead-status/${selectedLead._id}`, updateData)
      .then(() => {
        fetchLeads();
        setShowStatusDialog(false);
        setPassportNumber('');
        toast.success('Status updated successfully');
      })
      .catch((err) => {
        console.error('Error updating status:', err);
        toast.error('Failed to update status');
      });
  };

  const getStatusSeverity = useCallback((status) => {
    switch (status) {
      case 'Interested': return 'success';
      case 'Not Interested': return 'danger';
      case 'Passport Holder': return 'info';
      case 'Client': return 'success';
      case 'Agent': return 'warning';
      default: return 'secondary';
    }
  }, []);

  const statusTemplate = useCallback((rowData) => {
    return (
      <Badge
        value={rowData.status || 'NA'}
        severity={getStatusSeverity(rowData.status)}
        className="leads-status-badge"
      />
    );
  }, [getStatusSeverity]);

  const actionTemplate = useCallback((rowData) => (
    <div className="leads-action-buttons">
      <Button
        icon="pi pi-phone"
        className="p-button-rounded p-button-success p-button-sm"
        onClick={() => handleCall(rowData.number)}
        tooltip="Call"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-warning p-button-sm"
        onClick={() => openStatusDialog(rowData)}
        tooltip="Edit Status"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-bell"
        className="p-button-rounded p-button-info p-button-sm"
        onClick={() => handleOpenModal(rowData)}
        tooltip="Set Reminder"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-help p-button-sm"
        onClick={() => handleOpenModalShow(rowData)}
        tooltip="Show Reminders"
        tooltipOptions={{ position: 'top' }}
      />
    </div>
  ), []);

  const phoneTemplate = useCallback((rowData) => (
    <span>{rowData.number}</span>
  ), []);

  const MobileCardView = useCallback(({ lead, index }) => (
    <div className="leads-mobile-lead-card" key={lead._id || index}>
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
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => handleCall(lead.number)}
          tooltip="Call"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => openStatusDialog(lead)}
          tooltip="Edit Status"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-bell"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={() => handleOpenModal(lead)}
          tooltip="Set Reminder"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-help p-button-sm"
          onClick={() => handleOpenModalShow(lead)}
          tooltip="Show Reminders"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    </div>
  ), [getStatusSeverity]);

  const filterItems = [
    ...filterStatusOptions.map(option => ({
      label: option.label,
      command: () => onStatusFilter({ value: option.value })
    })),
    {
      separator: true
    },
    {
      label: 'Clear Filters',
      icon: 'pi pi-filter-slash',
      command: clearFilters
    }
  ];

  const getCurrentFilterLabel = () => {
    const currentFilter = filterStatusOptions.find(opt => opt.value === lazyParams.status);
    return currentFilter ? currentFilter.label : 'Filter by Status';
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLeads();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchLeads]);

  return (
    <div className="leads-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="leads-header">
        <h2>Assigned Leads</h2>
        <div className="leads-header-actions">
          {!isMobile ? (
            <>
              <span className="p-input-icon-left">
                
                <InputText
                  value={lazyParams.search}
                  onChange={onSearch}
                  placeholder="Search leads..."
                />
              </span>
              <SplitButton
                label={getCurrentFilterLabel()}
                model={filterItems}
                className="p-button-outlined leads-filter-btn"
                icon="pi pi-filter"
              />
              {(lazyParams.search || lazyParams.status !== 'all') && (
                <Button
                  icon="pi pi-times"
                  className="p-button-text p-button-plain leads-clear-filters"
                  onClick={clearFilters}
                  tooltip="Clear all filters"
                  tooltipOptions={{ position: 'top' }}
                />
              )}
            </>
          ) : (
            <Dropdown
              value={lazyParams.status}
              options={filterStatusOptions}
              onChange={onStatusFilter}
              placeholder="Filter by status"
              className="leads-mobile-filter"
            />
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
            
              <InputText
                value={lazyParams.search}
                onChange={onSearch}
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
              <p>{lazyParams.search || lazyParams.status !== 'all' ? 'No leads match your filters.' : 'No leads have been assigned yet.'}</p>
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

      <Notes
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        addedBy={notesData.addedBy}
        addedByType={notesData.addedByType}
        leadId={notesData.leadId}
      />

      {isModalOpenShow && (
        <ShowNotes
          isOpen={isModalOpenShow}
          onClose={handleCloseModalShow}
          leadId={leadId}
          addedBy={addedById}
        />
      )}
    </div>
  );
}

export default Leads;