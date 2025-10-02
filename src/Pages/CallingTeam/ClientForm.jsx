import React, { useEffect, useState } from 'react';
import '../CSS/ClientForm.css';
import axios from 'axios';
import {useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Dropdown } from 'primereact/dropdown';

const ClientForm = () => {
  const CallingTeamId = localStorage.getItem('CallingTeamId');
  const location = useLocation();
  const leadId = location.state?.leadId;
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB');
  const APi_URL = import.meta.env.VITE_API_URL;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const Navigate = useNavigate();
  const [files, setFiles] = useState({
    clientPhoto: null,
    clientSign: null,
  });

  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    address: '',
    state: '',
    pinCode: '',
    contactNumber: '',
    whatsappNumber: '',
    familyContact: '',
    email: '',
    passportNumber: '',
    dob: '',
    passportIssue: '',
    passportExpiry: '',
    nationality: 'Indian',
    passportType: '', // Changed from separate ecr/ecnr booleans
    occupation: '',
    placeOfEmployment: '',
    lastExperience: '',
    lastSalary: '',
    expectedSalary: '',
    medicalReport: '',
    InterviewStatus: 'Not Applied',
    pccStatus: '',
    agentCode: CallingTeamId,
    ServiceCharge: '',
    MedicalCharge: '',
    filledBy: CallingTeamId,
    leadId: leadId,
  });

  const fetchLead = async () => {
    try {
      const res = await axios.get(`${APi_URL}/api/contact/getbyId/${leadId}`);
      setFormData((prev) => ({
        ...prev,
        contactNumber: res.data.number || '',
        passportNumber: res.data.passportNumber || '',
      }));
      toast.success("Lead data fetched successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch lead data");
    }
  };

  useEffect(() => {
    if (!leadId) {
      toast.error("No ID found");
      return;
    }
    fetchLead();
  }, [leadId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles((prev) => ({
      ...prev,
      [name]: selectedFiles[0],
    }));
  };

  // Validation for the form
  const validateForm = () => {
    const requiredFields = [
      'fullName', 'fatherName', 'address', 'state', 'pinCode',
      'contactNumber', 'email', 'dob', 'occupation', 'passportType'
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  // Final form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const data = new FormData();

    // Append form fields
    for (let key in formData) {
      data.append(key, formData[key]);
    }

    // Append files
    if (files.clientPhoto) data.append('clientPhoto', files.clientPhoto);
    if (files.clientSign) data.append('clientSign', files.clientSign);

    try {
      await axios.post(`${APi_URL}/api/client-form/add`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Registration successful!');

      // Reset form
      setFormData({
        ...formData,
        ServiceCharge: '',
        MedicalCharge: '',
      });
      setFiles({
        clientPhoto: null,
        clientSign: null,
      });
    } catch (err) {
      console.error(err);
      toast.error('Submission failed!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
       <div className="navigation-header">
        <button 
          className="back-button"
          onClick={() => Navigate('/passport-holder')}
        >
          ← Back to Leads
        </button>
      </div>
      {/* Company Header */}
      <div className="company-header">
        <div>
          <h2>Chhaya International Pvt. Ltd.</h2>
          <p>LIG 2 Nirala Nagar Unnao<br />Uttar Pradesh 209801</p>
          <p>Email: chhayainternationalpvtltd@gmail.com</p>
          <p>Contact No.: 8081478307</p>
        </div>
        <img
          src="logo.jpg"
          alt="Company Logo"
          className="company-logo"
          style={{ width: "30%" }}
        />
      </div>

      <h3 className="form-title-client">Registration Form</h3>

      <form onSubmit={handleSubmit}>
        <div className="flex-row space-between">
          <label>Date: {formattedDate}</label>
          <label>Reg No.: Auto-generated</label>
        </div>

        <h4>● Personal Details</h4>
        <div className="grid-2">
          <label>Full Name: <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required /></label>
          <label>Father Name: <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required /></label>
          <label>Date of Birth: <input type="date" name="dob" value={formData.dob} onChange={handleChange} required /></label>
          <label>Address: <input type="text" name="address" value={formData.address} onChange={handleChange} required /></label>
          <label>State: <input type="text" name="state" value={formData.state} onChange={handleChange} required /></label>
          <label>PIN Code: <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} required /></label>
          <label>Contact No.: <input type="text" name="contactNumber" disabled value={formData.contactNumber} onChange={handleChange} /></label>
          <label>WhatsApp Number: <input type="text" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} /></label>
          <label>Family Contact: <input type="text" name="familyContact" value={formData.familyContact} onChange={handleChange} /></label>
          <label>Email: <input type="email" name="email" value={formData.email} onChange={handleChange} required /></label>
          <label>Client Photo:
            <input
              type="file"
              name="clientPhoto"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
          <label>Client Signature:
            <input
              type="file"
              name="clientSign"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <h4>● Passport Details</h4>
        <div className="grid-2">
          <label>Passport Number: <input type="text" disabled name="passportNumber" value={formData.passportNumber} onChange={handleChange} /></label>
          <label>Passport Issue: <input type="date" name="passportIssue" value={formData.passportIssue} onChange={handleChange} /></label>
          <label>Passport Expiry: <input type="date" name="passportExpiry" value={formData.passportExpiry} onChange={handleChange} /></label>
          <label>Nationality: <input type="text" value="Indian" readOnly /></label>
          <div className="checkbox-row">
            <label>
              <input
                type="radio"
                name="passportType"
                value="ECR"
                checked={formData.passportType === "ECR"}
                onChange={handleChange}
                required
              /> ECR
            </label>
            <label>
              <input
                type="radio"
                name="passportType"
                value="ECNR"
                checked={formData.passportType === "ECNR"}
                onChange={handleChange}
                required
              /> ECNR
            </label>
          </div>
        </div>

        <h4>● Work Details</h4>
        <div className="grid-2">
          <label>Occupation: <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} required /></label>
          <label>Place of Employment: <input type="text" name="placeOfEmployment" value={formData.placeOfEmployment} onChange={handleChange} /></label>
          <label>Last Experience: <input type="text" name="lastExperience" value={formData.lastExperience} onChange={handleChange} /></label>
          <label>Last Salary & Post Details: <input type="text" name="lastSalary" value={formData.lastSalary} onChange={handleChange} /></label>
          <label>New Expected Salary: <input type="number" name="expectedSalary" value={formData.expectedSalary} onChange={handleChange} /></label>

          <label>
            Medical Report:
            <Dropdown
              value="Pending"
              options={[
                { label: 'Fit', value: 'Fit' },
                { label: 'Unfit', value: 'Unfit' },
                { label: 'Pending', value: 'Pending' }
              ]}
              onChange={(e) => setFormData({ ...formData, medicalReport: e.value })}
              placeholder="Select Medical Report"
              className="w-full"
              disabled
            />
          </label>

          <label>Interview Status: <input type="text" disabled value={formData.InterviewStatus} /></label>
          <label>PCC Status: <input type="text" name="pccStatus" value={formData.pccStatus} onChange={handleChange} /></label>

          <label>Service Charge: <input type="number" name="ServiceCharge" value={formData.ServiceCharge} onChange={handleChange} /></label>
          <label>Medical Charge: <input type="number" name="MedicalCharge" value={formData.MedicalCharge} onChange={handleChange} /></label>
        </div>

        <p className="declaration">
          I hereby accept the all details filled above is correct and I certify that I do not apply my passport
          for another country or office during 3 months of Application submitted date.
        </p>

        <div className="grid-2">
          <label>Agent Code: <input type="text" name="agentCode" disabled value={formData.agentCode} onChange={handleChange} /></label>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            className="submit-btn"
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: '#007bff', padding: '10px 30px' }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              'Complete Registration'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;