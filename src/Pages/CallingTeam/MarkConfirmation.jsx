import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ToastContainer, toast } from "react-toastify";
import { Button } from "primereact/button";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import '../CSS/MarkConfirmation.css'

function MarkConfirmation() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 0 });

  const assignedToId = localStorage.getItem("CallingTeamId");
  const searchTimeoutRef = useRef(null);

  const fetchFilledForms = async () => {
    try {
      setTableLoading(true);
      const page = lazyParams.page + 1;
      const limit = lazyParams.rows;

      const res = await axios.get(
        `${API_URL}/api/client-form/filled-by/${assignedToId}`,
        { params: { page, limit, search: globalFilter } }
      );

      if (res.data.success) {
        setForms(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        setForms([]);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch filled forms");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => { fetchFilledForms(); }, [lazyParams]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setLazyParams((prev) => ({ ...prev, page: 0, first: 0 }));
      fetchFilledForms();
    }, 600);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [globalFilter]);

  // Generic handler for all three actions
  const handleAction = async (id, fullName, type) => {
    const typeMap = {
      cancel: "Cancel",
      confirmation: "Confirmation",
      agreement: "Agreement",
    };

    const apiMap = {
      cancel: "markSendForCancel",
      confirmation: "markSendConfirmation",
      agreement: "markSendForAggrement",
    };

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Mark ${typeMap[type]} for ${fullName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, mark it!",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;

    try {
      await axios.put(`${API_URL}/api/client-form/${apiMap[type]}/${id}`);
      toast.success(`Marked ${typeMap[type]} successfully`);
      fetchFilledForms();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  // Action column template with icons + text
  const actionTemplate = (rowData) => (
    <div className="mark-btn">
      <Button
        label={rowData.isCancelSend ? "Cancel Sent" : "Mark Cancel"}
        className={rowData.isCancelSend ? "p-button-success p-button-sm" : "p-button-danger p-button-sm"}
        tooltip={rowData.isCancelSend ? "Cancel Sent" : "Mark Cancel"}
        tooltipOptions={{ position: "top" }}
        onClick={() => handleAction(rowData._id, rowData.fullName, "cancel")}
        disabled={rowData.isCancelSend}
      />
      <Button
        label={rowData.isConfirmationSend ? "Confirmation Sent" : "Mark Confirmation"}
        className={rowData.isConfirmationSend ? "p-button-success p-button-sm" : "p-button-warning p-button-sm"}
        tooltip={rowData.isConfirmationSend ? "Confirmation Sent" : "Mark Confirmation"}
        tooltipOptions={{ position: "top" }}
        onClick={() => handleAction(rowData._id, rowData.fullName, "confirmation")}
        disabled={rowData.isConfirmationSend}
      />
      <Button
        label={rowData.isAgreementSend ? "Agreement Sent" : "Mark Agreement"}
        className={rowData.isAgreementSend ? "p-button-success p-button-sm" : "p-button-info p-button-sm"}
        tooltip={rowData.isAgreementSend ? "Agreement Sent" : "Mark Agreement"}
        tooltipOptions={{ position: "top" }}
        onClick={() => handleAction(rowData._id, rowData.fullName, "agreement")}
        disabled={rowData.isAgreementSend}
      />
    </div>
  );

  const createdDateTemplate = (rowData) =>
    new Date(rowData.createdAt).toLocaleDateString("en-GB");

  const header = (
    <div className="table-header">
      <h2>Filled Forms for Confirmation</h2>
      <span className="p-input-icon-left">
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search by Name, Passport, Contact, RegNo..."
        />
      </span>
    </div>
  );

  return (
    <div className="p-m-3">
      <ToastContainer />
      {loading ? (
        <div className="loader-overlay">
          <div className="custom-spinner"></div>
        </div>
      ) : (
        <DataTable
          value={forms}
          paginator
          lazy
          totalRecords={totalRecords}
          rows={lazyParams.rows}
          first={lazyParams.first}
          onPage={(e) => setLazyParams(e)}
          scrollable
          scrollHeight="400px"
          loading={tableLoading}
          responsiveLayout="scroll"
          header={header}
          emptyMessage="No forms pending confirmation"
        >
          <Column field="regNo" header="Reg No" style={{ width: "120px" }} />
          <Column field="fullName" header="Full Name" style={{ width: "180px" }} />
          <Column field="contactNo" header="Contact No" style={{ width: "150px" }} />
          <Column field="passportNumber" header="Passport No" style={{ width: "150px" }} />
          <Column header="Created Date" body={createdDateTemplate} style={{ width: "130px" }} />
          <Column header="Action" body={actionTemplate} style={{ width: "250px" }} />
        </DataTable>
      )}
    </div>
  );
}

export default MarkConfirmation;
