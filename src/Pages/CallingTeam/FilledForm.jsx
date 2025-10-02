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
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../CSS/FilledForm.css';
import ApplyInterviewModal from '../../Components/ApplyInterviewModal';
import ShowNotes from '../../Components/ShowNotes'
function FilledForm() {
  // ==================== State Management ====================
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedStaffHead, setSelectedStaffHead] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedForms, setSelectedForms] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [transferringForms, setTransferringForms] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedFormForInterview, setSelectedFormForInterview] = useState(null);
const [isModalOpenShow, setIsModalOpenShow] = useState(false);
 const [leadId, setLeadId] = useState("");
  const [addedById, setaddedById] = useState("");
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1,
    search: ''
  });

  // ==================== Hooks & Constants ====================
  const APi_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const CallingTeamId = localStorage.getItem('CallingTeamId');

  // ==================== Data Fetching ====================
  useEffect(() => {
    fetchStaffHeads();
  }, []);

  useEffect(() => {
    fetchForms();
  }, [lazyParams]);

  const fetchStaffHeads = async () => {
    try {
      const res = await axios.get(`${APi_URL}/api/staff-heads`);
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

  const fetchForms = () => {
    setLoading(true);
    const { page, rows: limit, search } = lazyParams;

    axios.get(`${APi_URL}/api/contact/filled-forms/${CallingTeamId}`, {
      params: { page, limit, search }
    })
      .then((res) => {
        if (res.data.success) {
          setForms(res.data.data || []);
          setTotalRecords(res.data.total || 0);
        } else {
          toast.error(res.data.message || 'Failed to load forms');
          setForms([]);
          setTotalRecords(0);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching forms:', err);
        setForms([]);
        setTotalRecords(0);
        setLoading(false);
        toast.error('Failed to load forms');
      });
  };

  // ==================== Event Handlers ====================
  const onPage = (event) => {
    setLazyParams({
      ...lazyParams,
      first: event.first,
      rows: event.rows,
      page: event.page + 1
    });
  };

  const onSearch = (e) => {
    setLazyParams({
      ...lazyParams,
      search: e.target.value,
      first: 0,
      page: 1
    });
  };

  const handlePaymentBook = (form) => {
    navigate('/payment-book', { state: { phone: form.leadId?._id } });
  };

  const handleShowConversation = (form) => {
    const addedBy = localStorage.getItem("CallingTeamId");
    const leadId = form.leadId;
    console.log(form.leadId);
    
    setaddedById(addedBy)
    setLeadId(leadId)
    setIsModalOpenShow(true);
  }

    const handleCloseModalShow = () => {
    setIsModalOpenShow(false);
  };
  const handleViewForm = (form) => {
    const lId = form.leadId?._id;
    navigate("/view-form", { state: { lId } });
  };

  const handleFormSelection = (form) => {
    const isSelected = selectedForms.some(f => f._id === form._id);
    if (isSelected) {
      setSelectedForms(selectedForms.filter(f => f._id !== form._id));
    } else {
      setSelectedForms([...selectedForms, form]);
    }
  };

  // ==================== Interview Application Handlers ====================
  const handleApplyInterview = (form) => {
    if (form.InterviewStatus === 'Applied' || form.InterviewStatus === 'Pass' || form.InterviewStatus === 'Fail') {
      toast.info(`Interview already ${form.InterviewStatus}`);
      return;
    }
    setSelectedFormForInterview(form);
    setShowInterviewModal(true);
  };

  const handleInterviewSuccess = () => {
    toast.success('Interview applied successfully!');
    fetchForms();
    setShowInterviewModal(false);
    setSelectedFormForInterview(null);
  };

  const handleInterviewClose = () => {
    setShowInterviewModal(false);
    setSelectedFormForInterview(null);
  };

  // ==================== Transfer Logic ====================
  const openTransferDialog = () => {
    if (selectedForms.length === 0) {
      toast.warn('Please select at least one form to transfer');
      return;
    }
    setShowTransferDialog(true);
  };

  const closeTransferDialog = () => {
    setShowTransferDialog(false);
    setSelectedStaffHead(null);
  };

  const transferForms = async () => {
    if (!selectedStaffHead) {
      toast.warn('Please select a staff head');
      return;
    }

    setTransferringForms(true);
    try {
      const response = await axios.post(`${APi_URL}/api/client-form/transfer`, {
        leadIds: selectedForms.map(form => form.leadId?._id),
        transferredBy: CallingTeamId,
        transferredTo: selectedStaffHead,
      });

      toast.success(response.data.message || 'Forms transferred successfully');
      fetchForms();
      setSelectedForms([]);
      closeTransferDialog();
    } catch (error) {
      console.error('Transfer failed:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'Failed to transfer forms');
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setTransferringForms(false);
    }
  };

  // ==================== Helper Functions ====================
  const getInterviewStatusSeverity = (status) => {
    const severityMap = {
      'Applied': 'info',
      'Pass': 'success',
      'Fail': 'danger',
      'Pending': 'warning'
    };
    return severityMap[status] || 'secondary';
  };

  // NEW: Transfer status helper functions
  // NEW: Transfer status helper functions
  const getTransferStatus = (form) => {
    if (form.transferredTo) {
      // Check if transferredTo is an object with _id property
      const transferredToId = form.transferredTo._id || form.transferredTo;
      const transferredToStaff = staffOptions.find(staff => staff.value === transferredToId);

      return {
        status: 'Transferred',
        to: transferredToStaff ? transferredToStaff.label : (form.transferredTo.name || 'Unknown Staff')
      };
    }
    return {
      status: 'Not Transferred',
      to: null
    };
  };

  const getTransferStatusSeverity = (status) => {
    const severityMap = {
      'Transferred': 'warning',
      'Not Transferred': 'secondary'
    };
    return severityMap[status] || 'secondary';
  };

  const canApplyInterview = (form) => {
    return !form.InterviewStatus ||
      form.InterviewStatus === '' ||
      form.InterviewStatus === 'Pending' ||
      form.InterviewStatus === null ||
      form.InterviewStatus === 'Not Applied';
  };

  // ==================== Column Templates ====================
  const interviewStatusTemplate = (rowData) => (
    <Badge
      value={rowData.InterviewStatus || 'Not Applied'}
      severity={getInterviewStatusSeverity(rowData.InterviewStatus)}
      className="forms-interview-badge"
    />
  );

  // NEW: Transfer status template
  const transferStatusTemplate = (rowData) => {
    const transferInfo = getTransferStatus(rowData);
    return (
      <div className="forms-transfer-status">
        <Badge
          value={transferInfo.status}
          severity={getTransferStatusSeverity(transferInfo.status)}
          className="forms-transfer-badge"
        />
        {transferInfo.to && (
          <div className="forms-transfer-to">
            <small className="p-text-secondary">To: {transferInfo.to}</small>
          </div>
        )}
      </div>
    );
  };

  const passportTemplate = (rowData) => (
    <span>{rowData.passportNumber || 'N/A'}</span>
  );

  const phoneTemplate = (rowData) => (
    <div className="forms-phone-cell">
      <span>{rowData.leadId?.number || 'N/A'}</span>
    </div>
  );

  const nameTemplate = (rowData) => (
    <div className="forms-name-cell">
      <span>{rowData.fullName || 'N/A'}</span>
    </div>
  );

  const regNoTemplate = (rowData) => (
    <div className="forms-regno-cell">
      <span>{rowData.regNo || 'N/A'}</span>
    </div>
  );

  const actionTemplate = (rowData) => (
    <div className="forms-action-buttons">
      <Button
        icon="pi pi-book"
        className="p-button-success p-button-sm forms-action-btn"
        onClick={() => handlePaymentBook(rowData)}
        tooltip="Payments Book"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-eye"
        className="p-button-help p-button-sm forms-action-btn"
        onClick={() => handleViewForm(rowData)}
        tooltip="View Form"   
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-comments"
        className="p-button-info p-button-sm forms-action-btn"
        onClick={() => handleShowConversation(rowData)}
        tooltip="Show Conversation"
        tooltipOptions={{ position: 'top' }}
      />
      {canApplyInterview(rowData) && (
        <Button
          icon="pi pi-users"
          className="p-button-warning p-button-sm forms-action-btn"
          onClick={() => handleApplyInterview(rowData)}
          tooltip="Apply Interview"
          tooltipOptions={{ position: 'top' }}
        />
      )}
    </div>
  );

  // ==================== Mobile Card Component ====================
  const MobileCardView = ({ form, index, selected, onSelect }) => {
    const transferInfo = getTransferStatus(form);

    return (
      <div className={`forms-mobile-form-card ${selected ? "selected-form" : ""}`}>
        <div className="forms-card-header">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(form)}
            className="forms-checkbox"
          />
          <div className="forms-form-number">#{index + 1}</div>
          {/* REMOVED: Status badge from mobile view */}
          <Badge
            value={form.InterviewStatus || "Not Applied"}
            severity={getInterviewStatusSeverity(form.InterviewStatus)}
            className="forms-interview-badge-mobile"
          />
        </div>

        {/* NEW: Transfer status in mobile view */}
        <div className="forms-transfer-status-mobile">
          <Badge
            value={transferInfo.status}
            severity={getTransferStatusSeverity(transferInfo.status)}
            className="forms-transfer-badge-mobile"
          />
          {transferInfo.to && (
            <span className="forms-transfer-to-mobile">To: {transferInfo.to}</span>
          )}
        </div>

        <div className="forms-card-content">
          <div className="forms-info-row">
            <span className="forms-label">Name:</span>
            <span className="forms-value">{form.fullName || "N/A"}</span>
          </div>
          <div className="forms-info-row">
            <span className="forms-label">Mobile:</span>
            <span className="forms-value">{form.leadId?.number || "N/A"}</span>
          </div>
          <div className="forms-info-row">
            <span className="forms-label">Passport:</span>
            <span className="forms-value">{form.passportNumber || "N/A"}</span>
          </div>
          <div className="forms-info-row">
            <span className="forms-label">Reg No:</span>
            <span className="forms-value">{form.regNo || "N/A"}</span>
          </div>
          <div className="forms-info-row">
            <span className="forms-label">Date:</span>
            <span className="forms-value">
              {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>

        <div className="forms-card-actions">
          <Button
            icon="pi pi-book"
            className="p-button-rounded p-button-success p-button-sm forms-action-btn-mobile"
            onClick={() => handlePaymentBook(form)}
            tooltip="Payments Book"
            tooltipOptions={{ position: 'top' }}
          />
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-help p-button-sm forms-action-btn-mobile"
            onClick={() => handleViewForm(form)}
            tooltip="View Form"
            tooltipOptions={{ position: 'top' }}
          />
          {canApplyInterview(form) && (
            <Button
              icon="pi pi-users"
              className="p-button-rounded p-button-warning p-button-sm forms-action-btn-mobile"
              onClick={() => handleApplyInterview(form)}
              tooltip="Apply Interview"
              tooltipOptions={{ position: 'top' }}
            />
          )}
        </div>
      </div>
    );
  };

  // ==================== Render ====================
  return (
    <div className="forms-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header Section */}
      <div className="forms-header">
        <h2>Filled Forms</h2>
        <div className="forms-header-actions">
          {!isMobile && (
            <span className="p-input-icon-left">
              <InputText
                value={lazyParams.search}
                onChange={onSearch}
                placeholder="Search by name, passport or reg no"
              />
            </span>
          )}
          <Button
            icon="pi pi-users"
            className="p-button-secondary"
            onClick={openTransferDialog}
            disabled={selectedForms.length === 0}
            tooltip="Transfer Selected"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="forms-loading-container">
          <ProgressSpinner />
        </div>
      ) : forms.length === 0 ? (
        /* Empty State */
        <div className="forms-no-forms">
          <i className="pi pi-info-circle"></i>
          <p>{lazyParams.search ? 'No forms match your search.' : 'No filled forms found.'}</p>
        </div>
      ) : isMobile ? (
        /* Mobile View */
        <div className="forms-mobile-forms-container">
          <div className="forms-mobile-search">
            <span className="p-input-icon-left">
              <InputText
                value={lazyParams.search}
                onChange={onSearch}
                placeholder="Search forms..."
              />
            </span>
          </div>

          {forms.map((form, index) => (
            <MobileCardView
              key={form._id || index}
              form={form}
              index={index}
              selected={selectedForms.some(f => f._id === form._id)}
              onSelect={handleFormSelection}
            />
          ))}
        </div>
      ) : (
        /* Desktop View */
        <div className="forms-desktop-table-container">
          <DataTable
            value={forms}
            selection={selectedForms}
            onSelectionChange={(e) => setSelectedForms(e.value)}
            dataKey="_id"
            lazy
            paginator
            rows={lazyParams.rows}
            totalRecords={totalRecords}
            first={lazyParams.first}
            onPage={onPage}
            loading={loading}
            className="forms-custom-datatable"
            stripedRows
            responsiveLayout="scroll"
            emptyMessage="No forms found."
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            <Column header="Sr No" body={(rowData, { rowIndex }) => rowIndex + 1} />
            <Column field="regNo" header="Reg No" body={regNoTemplate} />
            <Column field="fullName" header="Name" body={nameTemplate} />
            <Column header="Phone Number" body={phoneTemplate} />
            <Column header="Passport Number" body={passportTemplate} />
            {/* REMOVED: Status Column */}
            <Column header="Interview Status" body={interviewStatusTemplate} />
            {/* NEW: Transfer Status Column */}
            <Column header="Transfer Status" body={transferStatusTemplate} />
            <Column header="Actions" body={actionTemplate} headerStyle={{ width: '200px' }} />
          </DataTable>
        </div>
      )}

      {/* Transfer Dialog */}
      <Dialog
        header="Transfer Selected Forms"
        visible={showTransferDialog}
        style={{ width: '400px' }}
        onHide={closeTransferDialog}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={closeTransferDialog}
              className="p-button-text"
              disabled={transferringForms}
            />
            <Button
              label={transferringForms ? "Transferring..." : "Transfer"}
              icon={transferringForms ? "pi pi-spin pi-spinner" : "pi pi-check"}
              onClick={transferForms}
              disabled={!selectedStaffHead || transferringForms}
              autoFocus
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <p>Transferring {selectedForms.length} form(s)</p>
            <label htmlFor="staffHead">Staff Head</label>
            <Dropdown
              id="staffHead"
              value={selectedStaffHead}
              options={staffOptions}
              onChange={(e) => setSelectedStaffHead(e.value)}
              placeholder="Select a staff head"
              disabled={transferringForms}
            />
          </div>
          {transferringForms && (
            <div className="p-field mt-3">
              <ProgressSpinner style={{ width: '30px', height: '30px' }} />
              <small className="p-text-secondary ml-2">Transferring forms...</small>
            </div>
          )}
        </div>
      </Dialog>

      {/* Apply Interview Modal */}
      {selectedFormForInterview && (
        <ApplyInterviewModal
          isOpen={showInterviewModal}
          onClose={handleInterviewClose}
          leadId={selectedFormForInterview.leadId?._id}
          onSuccess={handleInterviewSuccess}
        />
      )}

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

export default FilledForm;