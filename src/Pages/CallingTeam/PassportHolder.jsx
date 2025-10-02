import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { Badge } from "primereact/badge";
import { InputText } from "primereact/inputtext";
import { useMediaQuery } from "react-responsive";
import axios from "axios";
import "../CSS/Leads.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "primereact/button";

function PassportHolder() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const APi_URL= import.meta.env.VITE_API_URL;
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1,
    search: "",
  });

  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const CallingTeamId = localStorage.getItem("CallingTeamId");

  // Fetch leads
  useEffect(() => {
    fetchLeads();
  }, [lazyParams]);

  const fetchLeads = () => {
    setLoading(true);
    const { page, rows: limit, search } = lazyParams;

    axios
      .get(
        `${APi_URL}/api/contact/get-passport-holder-leads/${CallingTeamId}`,
        { params: { page, limit, search } }
      )
      .then((res) => {
        const { data, pagination } = res.data;
        // Only keep Passport Holder leads where form is NOT filled
        const filtered = (data || []).filter(
          (lead) => lead.status === "Passport Holder" && !lead.isFormFilled
        );
        setLeads(filtered);
        setTotalRecords(pagination?.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching leads:", err);
        setLeads([]);
        setTotalRecords(0);
        setLoading(false);
        toast.error("Failed to load leads");
      });
  };

  const onPage = (event) => {
    setLazyParams({
      ...lazyParams,
      first: event.first,
      rows: event.rows,
      page: event.page + 1,
    });
  };

  const onSearch = (e) => {
    const value = e.target.value;
    setLazyParams({
      ...lazyParams,
      search: value,
      first: 0,
      page: 1,
    });
  };

  const getStatusSeverity = (status) => {
    switch (status) {
      case "Passport Holder":
        return "info";
      default:
        return "secondary";
    }
  };

  const statusTemplate = (rowData) => (
    <Badge
      value={rowData.status || "NA"}
      severity={getStatusSeverity(rowData.status)}
      className="leads-status-badge"
    />
  );

  const actionTemplate = (rowData) => (
    <div className="leads-action-buttons">
      <Button
        label="Fill Form"
        className="p-button-info p-button-sm leads-form-btn"
        onClick={() =>
          navigate(`/form`, { state: { leadId: rowData._id } })
        }
      />
    </div>
  );

  return (
    <div className="leads-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="leads-header">
        <h2>Passport Holder Leads - Fill Form</h2>
        {!isMobile && (
          <span className="p-input-icon-left">
            <InputText
              value={lazyParams.search}
              onChange={onSearch}
              placeholder="Search by number and passport"
            />
          </span>
        )}
      </div>

      {loading ? (
        <div className="leads-loading-container">
          <ProgressSpinner />
        </div>
      ) : leads.length === 0 ? (
        <div className="leads-no-leads">
          <i className="pi pi-info-circle"></i>
          <p>
            {lazyParams.search
              ? "No leads match your search."
              : "No Passport Holder leads pending form."}
          </p>
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
          >
            <Column
              header="Sr No"
              body={(rowData, { rowIndex }) => rowIndex + 1}
            />
            <Column
              header="Zone"
              body={(rowData) => rowData.zone?.zoneName || "N/A"}
            />
            <Column field="number" header="Phone Number" />
            <Column header="Passport Number" body={(rowData) => rowData.passportNumber || "N/A"} />
            <Column header="Status" body={statusTemplate} />
            <Column header="Actions" body={actionTemplate} />
          </DataTable>
        </div>
      )}
    </div>
  );
}

export default PassportHolder;
