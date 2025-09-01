import { useEffect, useState, useCallback } from "react";
import '../CSS/PaymentBook.css';
import { User, CreditCard, X, Phone, Mail, MapPin, Calendar, FileText, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PaymentBook = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [users, setUsers] = useState({});
  const [amount, setAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const location = useLocation();
  const { phone } = location.state || {};
  const [TotalServiceCharge, setTotalServiceCharge] = useState(0);
  const [TotalMedicalCharge, setTotalMedicalCharge] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch client details
  useEffect(() => {
    const fetchUserData = async () => {
      if (phone && phone._id) {
        try {
          setIsLoading(true);
          const res = await axios.get(`http://localhost:5000/api/client-form/getbyleadId/${phone._id}`);
          setUsers(res.data);
          setTotalServiceCharge(Number(res?.data?.officeConfirmation?.ServiceCharge) || 0);
          setTotalMedicalCharge(Number(res?.data?.officeConfirmation?.MedicalCharge) || 0);
          setError(null);
        } catch (err) {
          console.error("Error fetching user:", err);
          setError("Failed to load user data");
          toast.error("Failed to load user data");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [phone]);

  // Fetch payments for this lead
  const fetchPayments = useCallback(async (leadId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/payment/payment/${leadId}`);
      setPayments(res.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to load payment history");
      toast.error("Failed to load payment history");
    }
  }, []);

  useEffect(() => {
    if (users._id) {
      fetchPayments(users._id);
    }
  }, [users._id, fetchPayments]);

  // Calculate summary
  const calculateCharges = useCallback(() => {
    const serviceTotal = TotalServiceCharge || 0;
    const medicalTotal = TotalMedicalCharge || 0;

    const servicePaid = payments
      .filter(p => p.paymentFor === "Service")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const medicalPaid = payments
      .filter(p => p.paymentFor === "Medical")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      service: {
        total: serviceTotal,
        paid: servicePaid,
        pending: Math.max(0, serviceTotal - servicePaid)
      },
      medical: {
        total: medicalTotal,
        paid: medicalPaid,
        pending: Math.max(0, medicalTotal - medicalPaid)
      }
    };
  }, [TotalServiceCharge, TotalMedicalCharge, payments]);

  const paymentData = calculateCharges();

  // Check if both charges are fully paid
  const isFullyPaid = paymentData.service.pending === 0 && paymentData.medical.pending === 0;

  // Validate payment amount against remaining balance
  const validatePaymentAmount = () => {
    const enteredAmount = Number(amount);
    
    if (!paymentType) {
      return { isValid: false, message: "Please select payment type" };
    }
    
    if (enteredAmount <= 0) {
      return { isValid: false, message: "Please enter a valid amount" };
    }

    const remainingBalance = paymentType === "Service" 
      ? paymentData.service.pending 
      : paymentData.medical.pending;

    if (remainingBalance === 0) {
      return { 
        isValid: false, 
        message: `${paymentType} charges are already fully paid!` 
      };
    }

    if (enteredAmount > remainingBalance) {
      return { 
        isValid: false, 
        message: `Amount exceeds remaining balance of ₹${remainingBalance.toLocaleString()}` 
      };
    }

    return { isValid: true, message: "" };
  };

  // Handle new payment
  const handlePayment = async () => {
    if (!paymentType || !paymentMode || !amount || amount <= 0) {
      toast.error("Please fill all fields with valid values");
      return;
    }

    // Validate payment amount
    const validation = validatePaymentAmount();
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setIsProcessingPayment(true);

    try {
      const payload = {
        paymentFor: paymentType,
        amount: Number(amount),
        modeOfPayment: paymentMode,
        leadId: users._id,
        addedBy: localStorage.getItem("CallingTeamId")
      };

      await axios.post("http://localhost:5000/api/payment/payment", payload);

      toast.success(`Payment of ₹${amount} for ${paymentType} via ${paymentMode} processed successfully!`);
      setIsPaymentModalOpen(false);
      setPaymentType("");
      setPaymentMode("");
      setAmount("");

      // Refresh data
      fetchPayments(users._id);
      
      // Also refresh user data in case charges were updated
      if (phone && phone._id) {
        const res = await axios.get(`http://localhost:5000/api/client-form/getbyleadId/${phone._id}`);
        setUsers(res.data);
        setTotalServiceCharge(Number(res?.data?.officeConfirmation?.ServiceCharge) || 0);
        setTotalMedicalCharge(Number(res?.data?.officeConfirmation?.MedicalCharge) || 0);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Function to check if image URL is valid
  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    if (url.startsWith('http://') || url.startsWith('https://')) return true;
    return false;
  };

  // Reset modal when closed
  const handleCloseModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentType("");
    setPaymentMode("");
    setAmount("");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Sort payments
  const sortedPayments = useCallback(() => {
    let sortableItems = [...payments];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [payments, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter payments based on search term
  const filteredPayments = sortedPayments().filter(payment => {
    return (
      payment.paymentFor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.modeOfPayment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.amount?.toString().includes(searchTerm) ||
      formatDate(payment.createdAt)?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get current payments for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle Pay Now button click with validation
  const handlePayNowClick = () => {
    if (isFullyPaid) {
      toast.info("All charges have been fully paid!");
      return;
    }
    setIsPaymentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="paymentBook-loading">
        <Loader2 size={32} className="paymentBook-spinner" />
        <p>Loading payment information...</p>
      </div>
    );
  }

  if (error) {
    return <div className="paymentBook-error">Error: {error}</div>;
  }

  return (
    <div className="paymentBook-container">
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
      
      {/* Header */}
      <div className="paymentBook-header">
        <div className="paymentBook-header-content">
          <h1 className="paymentBook-title">PAYMENT BOOK</h1>
          <button
            onClick={handlePayNowClick}
            className={`paymentBook-pay-btn ${isFullyPaid ? 'paymentBook-pay-btn-disabled' : ''}`}
            disabled={!users._id || isFullyPaid}
            title={isFullyPaid ? "All charges have been fully paid" : "Make a payment"}
          >
            <CreditCard size={20} />
            {isFullyPaid ? 'Fully Paid' : 'Pay Now'}
          </button>
        </div>
      </div>

      <div className="paymentBook-main-content">
        {/* Left Box - Client Details */}
        <div className="paymentBook-left-box">
          <div className="paymentBook-client-section">
            <div className="paymentBook-profile-image">
              {isValidImageUrl(users.photo) ? (
                <img
                  src={users.photo}
                  alt="Profile"
                  className="paymentBook-profile-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <User size={60} className="paymentBook-detail-icon" />
              )}
            </div>

            <h3 className="paymentBook-client-name">{users.fullName || 'No Name'}</h3>

            <div className="paymentBook-client-details">
              <div className="paymentBook-detail-row">
                <Phone size={16} className="paymentBook-detail-icon" />
                <span className="paymentBook-detail-text">{users.contactNo || 'No phone number'}</span>
              </div>

              <div className="paymentBook-detail-row">
                <Mail size={16} className="paymentBook-detail-icon" />
                <span className="paymentBook-detail-text">{users.email || 'No email'}</span>
              </div>

              <div className="paymentBook-detail-row">
                <MapPin size={16} className="paymentBook-detail-icon" />
                <span className="paymentBook-detail-text">{users.address || 'No address'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Box - Payment Details */}
        <div className="paymentBook-right-box">
          <h3 className="paymentBook-payment-title">Payment Details</h3>

          <div className="paymentBook-charges-container">
            {/* Service Charges */}
            <div className="paymentBook-charge-card">
              <h4 className="paymentBook-charge-header paymentBook-service-header">Service Charges</h4>
              <div className="paymentBook-charge-grid">
                <div className="paymentBook-charge-item">
                  <p className="paymentBook-charge-label">Total Amount</p>
                  <p className="paymentBook-charge-amount paymentBook-amount-total">₹{TotalServiceCharge.toLocaleString()}</p>
                </div>
                <div className="paymentBook-charge-item">
                  <p className="paymentBook-charge-label">Paid</p>
                  <p className="paymentBook-charge-amount paymentBook-amount-paid">₹{paymentData.service.paid.toLocaleString()}</p>
                </div>
                <div className="paymentBook-charge-item">
                  <p className="paymentBook-charge-label">Pending</p>
                  <p className={`paymentBook-charge-amount paymentBook-amount-pending ${paymentData.service.pending > 0 ? 'paymentBook-pending-highlight' : 'paymentBook-fully-paid'}`}>
                    ₹{paymentData.service.pending.toLocaleString()}
                    {paymentData.service.pending === 0 && <span className="paymentBook-paid-badge"> ✓ Paid</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Medical Charges */}
            <div className="paymentBook-charge-card">
              <h4 className="paymentBook-charge-header paymentBook-medical-header">Medical Charges</h4>
              <div className="paymentBook-charge-grid">
                <div className="paymentBook-charge-item">
                  <p className="paymentBook-charge-label">Total Amount</p>
                  <p className="paymentBook-charge-amount paymentBook-amount-total">₹{TotalMedicalCharge.toLocaleString()}</p>
                </div>
                <div className="paymentBook-charge-item">
                  <p className="paymentBook-charge-label">Paid</p>
                  <p className="paymentBook-charge-amount paymentBook-amount-paid">₹{paymentData.medical.paid.toLocaleString()}</p>
                </div>
                <div className="paymentBook-charge-item">
                  <p className="paymentBook-charge-label">Pending</p>
                  <p className={`paymentBook-charge-amount paymentBook-amount-pending ${paymentData.medical.pending > 0 ? 'paymentBook-pending-highlight' : 'paymentBook-fully-paid'}`}>
                    ₹{paymentData.medical.pending.toLocaleString()}
                    {paymentData.medical.pending === 0 && <span className="paymentBook-paid-badge"> ✓ Paid</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="paymentBook-summary">
              <span className="paymentBook-summary-label">Total Pending:</span>
              <span className={`paymentBook-summary-amount ${isFullyPaid ? 'paymentBook-fully-paid' : ''}`}>
                ₹{(paymentData.service.pending + paymentData.medical.pending).toLocaleString()}
                {isFullyPaid && <span className="paymentBook-paid-badge"> ✓ All Paid</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="paymentBook-table-container">
        <div className="paymentBook-table-header">
          <h3 className="paymentBook-table-title">
            <FileText size={20} />
            Payment History
          </h3>
          
          <div className="paymentBook-table-controls">
            <div className="paymentBook-search-container">
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="paymentBook-search-input"
              />
            </div>
          </div>
        </div>

        {filteredPayments.length > 0 ? (
          <>
            <table className="paymentBook-table">
              <thead>
                <tr>
                  <th 
                    className="paymentBook-table-header-cell"
                    onClick={() => handleSort('paymentFor')}
                  >
                    <div className="paymentBook-table-sortable">
                      Payment For
                      {sortConfig.key === 'paymentFor' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="paymentBook-table-header-cell"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="paymentBook-table-sortable">
                      Amount
                      {sortConfig.key === 'amount' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="paymentBook-table-header-cell"
                    onClick={() => handleSort('modeOfPayment')}
                  >
                    <div className="paymentBook-table-sortable">
                      Payment Mode
                      {sortConfig.key === 'modeOfPayment' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="paymentBook-table-header-cell"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="paymentBook-table-sortable">
                      <Calendar size={16} />
                      Date
                      {sortConfig.key === 'createdAt' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPayments.map((payment) => (
                  <tr key={payment._id} className="paymentBook-table-row">
                    <td className="paymentBook-table-cell">
                      <span className={`paymentBook-payment-type paymentBook-payment-type-${payment.paymentFor?.toLowerCase()}`}>
                        {payment.paymentFor}
                      </span>
                    </td>
                    <td className="paymentBook-table-cell paymentBook-table-amount">
                      ₹{payment.amount?.toLocaleString()}
                    </td>
                    <td className="paymentBook-table-cell">
                      <span className={`paymentBook-payment-mode paymentBook-payment-mode-${payment.modeOfPayment?.toLowerCase()}`}>
                        {payment.modeOfPayment}
                      </span>
                    </td>
                    <td className="paymentBook-table-cell">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="paymentBook-pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="paymentBook-pagination-btn"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`paymentBook-pagination-btn ${currentPage === number ? 'paymentBook-pagination-active' : ''}`}
                  >
                    {number}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="paymentBook-pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="paymentBook-no-data">
            {searchTerm ? 'No matching payments found' : 'No payment history available'}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="paymentBook-modal-overlay">
          <div className="paymentBook-modal">
            <div className="paymentBook-modal-header">
              <h3 className="paymentBook-modal-title">Make Payment</h3>
              <button
                onClick={handleCloseModal}
                className="paymentBook-close-btn"
                disabled={isProcessingPayment}
              >
                <X size={24} />
              </button>
            </div>

            <div className="paymentBook-form">
              {/* Payment Type */}
              <div className="paymentBook-form-group">
                <label className="paymentBook-label">Payment For</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="paymentBook-select"
                  disabled={isProcessingPayment}
                >
                  <option value="">Select Payment Type</option>
                  {paymentData.medical.pending > 0 && (
                    <option value="Medical">
                      Medical Charges (₹{paymentData.medical.pending.toLocaleString()} remaining)
                    </option>
                  )}
                  {paymentData.service.pending > 0 && (
                    <option value="Service">
                      Service Charges (₹{paymentData.service.pending.toLocaleString()} remaining)
                    </option>
                  )}
                </select>
              </div>

              {/* Amount */}
              <div className="paymentBook-form-group">
                <label className="paymentBook-label">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="paymentBook-input"
                  min="1"
                  max={paymentType === "Service" ? paymentData.service.pending : paymentData.medical.pending}
                  disabled={isProcessingPayment}
                />
                {paymentType && (
                  <small className="paymentBook-amount-helper">
                    Maximum: ₹{(paymentType === "Service" ? paymentData.service.pending : paymentData.medical.pending).toLocaleString()}
                  </small>
                )}
              </div>

              {/* Payment Mode */}
              <div className="paymentBook-form-group">
                <label className="paymentBook-label">Mode of Payment</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="paymentBook-select"
                  disabled={isProcessingPayment}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="paymentBook-button-group">
                <button
                  onClick={handleCloseModal}
                  className="paymentBook-cancel-btn"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="paymentBook-submit-btn"
                  disabled={!paymentType || !paymentMode || !amount || amount <= 0 || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 size={16} className="paymentBook-loader spinning" />
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentBook;