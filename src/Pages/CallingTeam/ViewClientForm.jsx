import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../CSS/ViewClientForm.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ViewClientForm = () => {
  const [data, setData] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [interviewManagers, setInterviewManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState(false); // New state for interview application loading
  const [printing, setPrinting] = useState(false); // New state for print button loading

  const { state } = useLocation();
  const navigate = useNavigate();
  const location = useLocation();
  const leadId = location.state?.leadId;
  const callingTeamId = localStorage.getItem("CallingTeamId");
  const medicalOptions = ['Fit', 'Unfit', 'Pending'];

  useEffect(() => {
    if (isOpen) {
      axios.get("http://localhost:5000/api/interview-manager/getAll")
        .then((res) => setInterviewManagers(res.data))
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load interview managers');
        });
    }
  }, [isOpen]);

 const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/client-form/getbyleadId/${leadId}`);
        setData(res.data);
        setEditData(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load form data');
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!state) {
      navigate('/leads');
      return;
    }

   
    fetchData();
  }, [leadId, navigate, state]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...data });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...data });
    setError(null);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 500);
  };
  
  const handleApply = async () => {
    if (!selectedManager) {
      toast.error("Please select an Interview Manager!");
      return;
    }

    setApplying(true);
    try {
      await axios.post("http://localhost:5000/api/client-form/apply-interview", {
        leadId: leadId,
        interviewManagerId: selectedManager,
        callingTeamId: callingTeamId,
      });

      toast.success("Interview Applied Successfully!");
      fetchData()
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error applying for interview");
    } finally {
      setApplying(false);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await axios.put(`http://localhost:5000/api/client-form/update/${data._id}`, editData);
      setData(res.data.data);
      setEditData(res.data.data);
      setIsEditing(false);
      toast.success('Registration updated successfully!');
      fetchData()
    } catch (err) {
      console.error('Error updating registration:', err);
      setError(err.response?.data?.message || 'Failed to update registration');
      toast.error(err.response?.data?.message || 'Failed to update registration');
    } finally {
      setSaving(false);
    }
  };

  if (!state) return null;
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!data) return <div className="no-data">No data available</div>;

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="form-container">
        <div className="form-header">
          <div className="company-info">
            <h2>Chhaya International Pvt. Ltd.</h2>
            <p>LIG 2 Nehru Nagar Unnao</p>
            <p>Uttar Pradesh 209801</p>
            <p>Email: chhayainternationalpvtltd@gmail.com</p>
            <p>Contact No.: 8081478427</p>
          </div>
          <div className="client-images">
            <div className="image-box">
              <label>Client Photo:</label>
              <img src={data.photo || '/placeholder-user.jpg'} alt="Client" className="client-photo" />
            </div>
            <div className="image-box">
              <label>Client Signature:</label>
              <img src={data.Sign || '/placeholder-signature.png'} alt="Signature" className="client-signature" />
            </div>
          </div>
        </div>

        <div className="form-title-section">
          <h3 className="form-title">Registration Form</h3>
          <div className="form-meta">
            <span className="form-date"><strong>Date:</strong> {new Date(data.createdAt).toLocaleDateString()}</span>
            <span className="form-reg-no"><strong>Registration No. :- </strong>{data.regNo}</span>
          </div>
        </div>

        <section className="form-section personal-details">
          <h4 className="section-title">
            <span className="section-bullet">•</span> Personal Details
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.fullName || ''}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.fullName}</div>
              )}
            </div>

            <div className="form-group">
              <label>Father's Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.fatherName || ''}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.fatherName}</div>
              )}
            </div>

            <div className="form-group">
              <label>Address:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.address}</div>
              )}
            </div>

            <div className="form-group">
              <label>State:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.state}</div>
              )}
            </div>

            <div className="form-group">
              <label>PIN Code:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.pinCode || ''}
                  onChange={(e) => handleInputChange('pinCode', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.pinCode}</div>
              )}
            </div>

            <div className="form-group">
              <label>WhatsApp Number:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.whatsAppNo || ''}
                  onChange={(e) => handleInputChange('whatsAppNo', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.whatsAppNo}</div>
              )}
            </div>

            <div className="form-group">
              <label>Family Number:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.familyContact || ''}
                  onChange={(e) => handleInputChange('familyContact', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.familyContact}</div>
              )}
            </div>
            <div className="form-group">
              <label>Contact Number:</label>
              <div className="form-control">{data.contactNo}</div></div>
            <div className="form-group full-width">
              <label>Email:</label>
              <div className="form-control">{data.email}</div>
            </div>
          </div>
        </section>

        <section className="form-section passport-details">
          <h4 className="section-title">
            <span className="section-bullet">•</span> Passport Details
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Passport Number:</label>
              <div className="form-control">{data.passportNumber}</div>
            </div>

            <div className="form-group">
              <label>Date of Birth:</label>
              <div className="form-control">{new Date(data.dateOfBirth).toLocaleDateString()}</div>
            </div>

            <div className="form-group">
              <label>Passport Expiry Date:</label>
              <div className="form-control">{new Date(data.passportExpiry).toLocaleDateString()}</div>
            </div>

            <div className="form-group">
              <label>Nationality:</label>
              <div className="form-control">{data.nationality}</div>
            </div>

            <div className="form-group checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="ecr"
                  checked={isEditing ? (editData.ecr || false) : data.ecr}
                  onChange={isEditing ? (e) => handleInputChange('ecr', e.target.checked) : undefined}
                  readOnly={!isEditing}
                />
                <label htmlFor="ecr">ECR</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="ecnr"
                  checked={isEditing ? (editData.ecnr || false) : data.ecnr}
                  onChange={isEditing ? (e) => handleInputChange('ecnr', e.target.checked) : undefined}
                  readOnly={!isEditing}
                />
                <label htmlFor="ecnr">ECNR</label>
              </div>
            </div>
          </div>
        </section>

        <section className="form-section work-details">
          <h4 className="section-title">
            <span className="section-bullet">•</span> Work Details
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Occupation:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.occupation || ''}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.occupation}</div>
              )}
            </div>

            <div className="form-group">
              <label>Place of Deployment:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.placeOfEmployment || ''}
                  onChange={(e) => handleInputChange('placeOfEmployment', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.placeOfEmployment}</div>
              )}
            </div>

            <div className="form-group">
              <label>Last Experience:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.lastExperience || ''}
                  onChange={(e) => handleInputChange('lastExperience', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.lastExperience}</div>
              )}
            </div>

            <div className="form-group">
              <label>Last Salary & Post Details:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.lastSalaryPostDetails || ''}
                  onChange={(e) => handleInputChange('lastSalaryPostDetails', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.lastSalaryPostDetails}</div>
              )}
            </div>

            <div className="form-group">
              <label>Expected Salary:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.expectedSalary || ''}
                  onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.expectedSalary}</div>
              )}
            </div>

            <div className="form-group">
              <label>Medical Report:</label>
              {isEditing ? (
                <select
                  className="form-control editable-input"
                  value={editData.medicalReport || ''}
                  onChange={(e) => handleInputChange('medicalReport', e.target.value)}
                >
                  {medicalOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="form-control">{data.medicalReport}</div>
              )}
            </div>

            <div className="form-group">
              <label>Interview Status:</label>
              <div className="form-control">{data.InterviewStatus}</div>
            </div>

            <div className="form-group">
              <label>PCC Status:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control editable-input"
                  value={editData.pccStatus || ''}
                  onChange={(e) => handleInputChange('pccStatus', e.target.value)}
                />
              ) : (
                <div className="form-control">{data.pccStatus}</div>
              )}
            </div>
          </div>
        </section>

        <section className="form-section office-use">
          <h4 className="section-title">
            <span className="section-bullet">•</span> For Office Use Only
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Agent Code:</label>
              <div className="form-control">{data.agentCode}</div>
            </div>

            <div className="form-group">
              <label>Country:</label>
              <div className="form-control">{data.officeConfirmation?.country?.countryName}</div>
            </div>

            <div className="form-group">
              <label>Work:</label>
              <div className="form-control">{data.officeConfirmation?.work?.jobTitle}</div>
            </div>

            <div className="form-group">
              <label>Salary:</label>
              <div className="form-control">{data.officeConfirmation?.salary}</div>
            </div>

            <div className="form-group">
              <label>Service Charge:</label>
              <div className="form-control">{data.officeConfirmation?.ServiceCharge}</div>
            </div>
            <div className="form-group">
              <label>Medical Charge:</label>
              <div className="form-control">{data.officeConfirmation?.MedicalCharge}</div>
            </div>
          </div>
        </section>

        <div className="form-footer">
          {!isEditing ? (
            <>
              <button 
                className="print-button" 
                onClick={handlePrint}
                disabled={printing}
              >
                {printing ? (
                  <>
                    <span className="button-spinner"></span>
                    Printing...
                  </>
                ) : 'Print Form'}
              </button>
              <button className="edit-button" onClick={handleEdit}>
                Edit
              </button>
              {data.InterviewStatus !== 'Pass' && data.InterviewStatus !== 'fail' && data.InterviewStatus !== 'Applied' && (
                <button className="edit-button" onClick={() => setIsOpen(true)}>
                  Apply Interview
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="update-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="button-spinner"></span>
                    Updating...
                  </>
                ) : 'Update'}
              </button>
              <button className="cancel-button" onClick={handleCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Apply for Interview</h2>
            <input
              type="text"
              placeholder="Search Interview Manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-box"
            />
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="dropdown"
            >
              <option value="">Select Interview Manager</option>
              {interviewManagers
                .filter((m) =>
                  m.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button 
                className="apply-btn" 
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? (
                  <>
                    <span className="button-spinner"></span>
                    Applying...
                  </>
                ) : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewClientForm;