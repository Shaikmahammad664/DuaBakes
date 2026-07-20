import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, authAPI } from '../services/api';
import '../styles/Payment.css';

export default function Payment({ cartItems }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    country: 'India',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: 'Andhra Pradesh',
    pinCode: '',
    phone: '',
    paymentMethod: 'Razorpay Secure',
    billingSameAsShipping: true,
    billingCountry: 'India',
    billingFirstName: '',
    billingLastName: '',
    billingAddress: '',
    billingApartment: '',
    billingCity: '',
    billingState: 'Andhra Pradesh',
    billingPinCode: '',
    billingPhone: '',
  });
  const [upiId, setUpiId] = useState('');
  const [upiRedirect, setUpiRedirect] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [canPay, setCanPay] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const saveTimer = useRef(null);
  const isSignedIn = Boolean(localStorage.getItem('user') || localStorage.getItem('token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const parsed = JSON.parse(storedUser);
    const userData = parsed.user || parsed;

    setForm((current) => ({
      ...current,
      email: userData.Email || userData.email || current.email,
      firstName: userData.FirstName || userData.firstName || current.firstName,
      lastName: userData.LastName || userData.lastName || current.lastName,
      phone: userData.PhoneNumber || userData.phone || current.phone,
      address: userData.address || current.address,
      apartment: userData.apartment || current.apartment,
      city: userData.city || current.city,
      state: userData.state || current.state,
      pinCode: userData.pinCode || current.pinCode,
      billingAddress: userData.billingAddress || current.billingAddress,
      billingApartment: userData.billingApartment || current.billingApartment,
      billingCity: userData.billingCity || current.billingCity,
      billingState: userData.billingState || current.billingState,
      billingPinCode: userData.billingPinCode || current.billingPinCode,
      billingPhone: userData.billingPhone || current.billingPhone,
    }));
  }, []);

  // validate and auto-save profile (debounced) to enable Pay Now
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setCanPay(false);
      return;
    }

    const parsed = JSON.parse(storedUser);
    const user = parsed.user || parsed;
    const email = form.email || user.Email || user.email;

    const validShipping = form.firstName && form.lastName && form.address && form.city && form.state && form.pinCode && form.phone;
    const validBilling = form.billingSameAsShipping
      ? true
      : (form.billingFirstName && form.billingLastName && form.billingAddress && form.billingCity && form.billingState && form.billingPinCode && form.billingPhone);

    const shouldSave = Boolean(email) && validShipping && validBilling;

    if (!shouldSave) {
      setCanPay(false);
      return;
    }

    // debounce save to avoid rapid API calls
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSavingProfile(true);
      setSaveError(null);
      const profilePayload = {
        Email: email,
        FirstName: form.firstName,
        LastName: form.lastName,
        PhoneNumber: form.phone,
        address: form.address,
        apartment: form.apartment,
        city: form.city,
        state: form.state,
        pinCode: form.pinCode,
        billingSameAsShipping: form.billingSameAsShipping,
        billingAddress: form.billingSameAsShipping ? form.address : form.billingAddress,
        billingApartment: form.billingSameAsShipping ? form.apartment : form.billingApartment,
        billingCity: form.billingSameAsShipping ? form.city : form.billingCity,
        billingState: form.billingSameAsShipping ? form.state : form.billingState,
        billingPinCode: form.billingSameAsShipping ? form.pinCode : form.billingPinCode,
        billingPhone: form.billingSameAsShipping ? form.phone : form.billingPhone,
      };

      try {
        await authAPI.updateProfile(profilePayload);
        // merge into localStorage user object
        const mergedUser = {
          ...(parsed.user || parsed),
          ...profilePayload,
          email: email,
          firstName: profilePayload.FirstName,
          lastName: profilePayload.LastName,
          phone: profilePayload.PhoneNumber,
        };
        const userToStore = parsed.user ? { ...parsed, user: mergedUser } : mergedUser;
        localStorage.setItem('user', JSON.stringify(userToStore));
        setCanPay(true);
      } catch (err) {
        console.warn('Profile save failed', err);
        setSaveError('Could not save profile — pay disabled');
        setCanPay(false);
      } finally {
        setSavingProfile(false);
      }
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form.firstName, form.lastName, form.address, form.apartment, form.city, form.state, form.pinCode, form.phone, form.billingSameAsShipping, form.billingAddress, form.billingApartment, form.billingCity, form.billingState, form.billingPinCode, form.billingPhone]);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 0;
  const totalWithTax = totalPrice + shippingFee;

  const formatToDDMMYYYY = (dateInput) => {
    if (!dateInput) return 'N/A';
    // If already in dd-mm-yyyy format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateInput)) return dateInput;
    // Try to parse ISO or other formats
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      const dd = String(parsed.getDate()).padStart(2, '0');
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const yyyy = parsed.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
    // Fallback: try to split common yyyy-mm-dd
    const parts = String(dateInput).split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateInput;
  };

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
    if (field === 'paymentMethod') {
      setPaymentConfirmed(false);
      setUpiId('');
      setUpiRedirect('');
    }
  };

  const getMissingFields = () => {
    const missing = [];
    if (!form.email) missing.push('Email');
    if (!form.firstName) missing.push('First name');
    if (!form.lastName) missing.push('Last name');
    if (!form.address) missing.push('Address');
    if (!form.city) missing.push('City');
    if (!form.state) missing.push('State');
    if (!form.pinCode) missing.push('PIN code');
    if (!form.phone) missing.push('Phone');
    if (!form.billingSameAsShipping) {
      if (!form.billingFirstName) missing.push('Billing first name');
      if (!form.billingLastName) missing.push('Billing last name');
      if (!form.billingAddress) missing.push('Billing address');
      if (!form.billingCity) missing.push('Billing city');
      if (!form.billingState) missing.push('Billing state');
      if (!form.billingPinCode) missing.push('Billing PIN code');
      if (!form.billingPhone) missing.push('Billing phone');
    }
    return missing;
  };

  return (
    <main className="payment-page page-content">
      <div className="payment-grid">
        <section className="checkout-panel">
          <div className="checkout-card">
            <div className="checkout-header">
              <div>
                <h1>Checkout</h1>
                <p>Review your delivery and payment details before placing the order.</p>
              </div>
            </div>

            <div className="section-block">
              <div className="section-title-row">
                <h2>Contact</h2>
                {!isSignedIn && (
                  <button type="button" className="text-link" onClick={() => navigate('/login', { state: { from: '/payment' } })}>Sign in</button>
                )}
              </div>
              <label className="field-label">
                <input
                  type="email"
                  value={form.email}
                  onChange={updateField('email')}
                  placeholder="Email"
                />
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={form.subscribe} onChange={updateField('subscribe')} />
                Email me with news and offers
              </label>
            </div>

            <div className="section-block">
              <h2>Delivery</h2>
              <div className="field-grid delivery-top">
                <label className="field-label country-field">
                  <select value={form.country} onChange={updateField('country')}>
                    <option>India</option>
                    {/* <option>United States</option> */}
                    {/* <option>United Kingdom</option> */}
                  </select>
                </label>
                <div className="name-grid">
                  <label className="field-label">
                    <input type="text" value={form.firstName} onChange={updateField('firstName')} placeholder="First name" />
                  </label>
                  <label className="field-label">
                    <input type="text" value={form.lastName} onChange={updateField('lastName')} placeholder="Last name" />
                  </label>
                </div>
              </div>

              <label className="field-label">
                <input type="text" value={form.address} onChange={updateField('address')} placeholder="Address" />
              </label>
              <label className="field-label">
                <input type="text" value={form.apartment} onChange={updateField('apartment')} placeholder="Apartment, suite, etc." />
              </label>

              <div className="field-grid two-columns">
                <label className="field-label">
                  <input type="text" value={form.city} onChange={updateField('city')} placeholder="City" />
                </label>
                <label className="field-label">
                  <select value={form.state} onChange={updateField('state')}>
                    <option>Andhra Pradesh</option>
                    <option>Delhi</option>
                    <option>Karnataka</option>
                  </select>
                </label>
              </div>

              <div className="field-grid two-columns">
                <label className="field-label">
                  <input type="text" value={form.pinCode} onChange={updateField('pinCode')} placeholder="PIN code" />
                </label>
                <label className="field-label">
                  <input type="tel" value={form.phone} onChange={updateField('phone')} placeholder="Phone" />
                </label>
              </div>
            </div>

            <div className="section-block shipping-block">
              <h2>Shipping method</h2>
              <p className="shipping-note">Enter your shipping address to view available shipping methods.</p>
            </div>

            <div className="section-block payment-block">
              <h2>Payment</h2>
              <p className="payment-note">All transactions are secure and encrypted.</p>

              <label className={`payment-card ${form.paymentMethod === 'Razorpay Secure' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Razorpay Secure"
                  checked={form.paymentMethod === 'Razorpay Secure'}
                  onChange={updateField('paymentMethod')}
                />
                <div>
                  <span className="payment-card-title">Razorpay Secure</span>
                  <span className="payment-card-subtitle">Cards, Wallets & NetBanking</span>
                </div>
                <span className="payment-chip">Visa • Mastercard</span>
              </label>

              <label className={`payment-card ${form.paymentMethod === 'UPI' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={form.paymentMethod === 'UPI'}
                  onChange={updateField('paymentMethod')}
                />
                <div>
                  <span className="payment-card-title">UPI</span>
                  <span className="payment-card-subtitle">PhonePe, Google Pay, Paytm</span>
                </div>
                <span className="payment-chip">UPI</span>
              </label>
              <label className={`payment-card ${form.paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={form.paymentMethod === 'Cash on Delivery'}
                  onChange={updateField('paymentMethod')}
                />
                <div>
                  <span className="payment-card-title">Cash on Delivery</span>
                </div>
              </label>

              {form.paymentMethod === 'UPI' && (
                <div className="field-grid upi-grid">
                  <label className="field-label">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(event) => {
                        setUpiId(event.target.value);
                        setUpiRedirect('');
                        setPaymentConfirmed(false);
                      }}
                      placeholder="Enter UPI ID"
                    />
                  </label>
                  <button
                    type="button"
                    className="pay-now-button"
                    onClick={() => {
                      const id = upiId.trim();
                      if (!id) return;
                      if (id.endsWith('@ybl')) {
                        setUpiRedirect('PhonePe');
                      } else if (id.endsWith('@okhdfc') || id.endsWith('@okicici') || id.endsWith('@okbank')) {
                        setUpiRedirect('Bank UPI');
                      } else {
                        setUpiRedirect('Google Pay');
                      }
                      setPaymentConfirmed(true);
                    }}
                  >
                    Continue with UPI
                  </button>
                </div>
              )}
            </div>

            <div className="section-block billing-block">
              <h2>Billing address</h2>
              <label className="billing-option">
                <input
                  type="radio"
                  name="billingAddress"
                  checked={form.billingSameAsShipping}
                  onChange={() => setForm((current) => ({ ...current, billingSameAsShipping: true }))}
                />
                Same as shipping address
              </label>
              <label className="billing-option">
                <input
                  type="radio"
                  name="billingAddress"
                  checked={!form.billingSameAsShipping}
                  onChange={() => setForm((current) => ({ ...current, billingSameAsShipping: false }))}
                />
                Use a different billing address
              </label>
            </div>

            {!form.billingSameAsShipping && (
              <div className="section-block">
                <h2>Billing details</h2>
                <div className="field-grid two-columns">
                  <label className="field-label">
                    <select value={form.billingCountry} onChange={updateField('billingCountry')}>
                      <option>India</option>
                    </select>
                  </label>
                  <div className="name-grid">
                    <label className="field-label">
                      <input
                        type="text"
                        value={form.billingFirstName}
                        onChange={updateField('billingFirstName')}
                        placeholder="First name"
                      />
                    </label>
                    <label className="field-label">
                      <input
                        type="text"
                        value={form.billingLastName}
                        onChange={updateField('billingLastName')}
                        placeholder="Last name"
                      />
                    </label>
                  </div>
                </div>

                <label className="field-label">
                  <input
                    type="text"
                    value={form.billingAddress}
                    onChange={updateField('billingAddress')}
                    placeholder="Address"
                  />
                </label>
                <label className="field-label">
                  <input
                    type="text"
                    value={form.billingApartment}
                    onChange={updateField('billingApartment')}
                    placeholder="Apartment, suite, etc."
                  />
                </label>

                <div className="field-grid two-columns">
                  <label className="field-label">
                    <input
                      type="text"
                      value={form.billingCity}
                      onChange={updateField('billingCity')}
                      placeholder="City"
                    />
                  </label>
                  <label className="field-label">
                    <select value={form.billingState} onChange={updateField('billingState')}>
                      <option>Andhra Pradesh</option>
                      <option>Delhi</option>
                      <option>Karnataka</option>
                    </select>
                  </label>
                </div>

                <div className="field-grid two-columns">
                  <label className="field-label">
                    <input
                      type="text"
                      value={form.billingPinCode}
                      onChange={updateField('billingPinCode')}
                      placeholder="PIN code"
                    />
                  </label>
                  <label className="field-label">
                    <input
                      type="tel"
                      value={form.billingPhone}
                      onChange={updateField('billingPhone')}
                      placeholder="Phone"
                    />
                  </label>
                </div>
              </div>
            )}

            <button type="button" className={`pay-now-button ${(!canPay || savingProfile) ? 'disabled' : ''}`} onClick={async () => {
              // If profile is saving, notify user
              if (savingProfile) {
                setMessage('Saving profile — please wait before paying.');
                return;
              }

              // If not allowed to pay, show which fields are missing
              if (!canPay) {
                const missing = getMissingFields();
                if (missing.length > 0) {
                  setMessage('Please fill: ' + missing.slice(0, 6).join(', ') + (missing.length > 6 ? ', ...' : ''));
                } else {
                  setMessage('Please complete all required fields before proceeding.');
                }
                return;
              }

              const storedUser = localStorage.getItem('user');
              if (!storedUser) {
                navigate('/login');
                return;
              }

              const parsed = JSON.parse(storedUser);
              const user = parsed.user || parsed;
              const email = user.Email || user.email;
              const shippingAddress = {
                country: form.country,
                firstName: form.firstName,
                lastName: form.lastName,
                address: form.address,
                apartment: form.apartment,
                city: form.city,
                state: form.state,
                pinCode: form.pinCode,
                phone: form.phone,
              };
              const billingAddress = form.billingSameAsShipping
                ? { ...shippingAddress }
                : {
                    country: form.billingCountry,
                    firstName: form.billingFirstName,
                    lastName: form.billingLastName,
                    address: form.billingAddress,
                    apartment: form.billingApartment,
                    city: form.billingCity,
                    state: form.billingState,
                    pinCode: form.billingPinCode,
                    phone: form.billingPhone,
                  };

              const profilePayload = {
                Email: email,
                FirstName: form.firstName || user.FirstName || user.firstName || user.name,
                LastName: form.lastName || user.LastName || user.lastName,
                PhoneNumber: form.phone || user.PhoneNumber || user.phone,
                address: form.address,
                apartment: form.apartment,
                city: form.city,
                state: form.state,
                pinCode: form.pinCode,
                billingSameAsShipping: form.billingSameAsShipping,
                billingAddress: form.billingAddress,
                billingApartment: form.billingApartment,
                billingCity: form.billingCity,
                billingState: form.billingState,
                billingPinCode: form.billingPinCode,
                billingPhone: form.billingPhone,
              };

              // persist profile on backend (best-effort)
              try {
                await authAPI.updateProfile(profilePayload);
              } catch (err) {
                console.warn('Could not persist profile to backend', err);
              }

              const mergedUser = {
                ...(parsed.user || parsed),
                ...profilePayload,
                email: email,
                firstName: profilePayload.FirstName,
                lastName: profilePayload.LastName,
                phone: profilePayload.PhoneNumber,
                addressHistory: [
                  ...(user.addressHistory || []),
                  {
                    createdAt: new Date().toISOString(),
                    shippingAddress,
                    billingAddress,
                  },
                ],
              };

              const userToStore = parsed.user ? { ...parsed, user: mergedUser } : mergedUser;
              localStorage.setItem('user', JSON.stringify(userToStore));

              try {
                await ordersAPI.create({
                  PhoneNumber: form.phone || user.PhoneNumber || user.phone,
                  Email: email,
                  PaymentMethod: form.paymentMethod,
                  Items: cartItems.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.size,
                    delivery: item.delivery || null,
                  })),
                  TotalAmount: totalWithTax,
                  ShippingAddress: shippingAddress,
                  BillingAddress: billingAddress,
                  DeliveryDate: cartItems[0]?.delivery?.deliveryDate || null,
                  DeliveryTime: cartItems[0]?.delivery?.deliveryTime || null,
                  CakeText: cartItems[0]?.delivery?.cakeText || null,
                });
                setPaymentConfirmed(true);
                setMessage('Order placed successfully.');
              } catch (error) {
                const serverMsg = error?.response?.data?.detail || error?.message || 'Could not place order right now.';
                setMessage(serverMsg);
              }
            }}>
              {savingProfile ? 'Saving...' : 'Pay now'}
            </button>
            {message && <p className="payment-confirmation">{message}</p>}
            {saveError && <p className="error-message">{saveError}</p>}
            {paymentConfirmed && form.paymentMethod !== 'UPI' && (
              <p className="payment-confirmation">Payment method selected: {form.paymentMethod}</p>
            )}
            {paymentConfirmed && form.paymentMethod === 'UPI' && upiRedirect && (
              <p className="payment-confirmation">Redirecting to: {upiRedirect}</p>
            )}
          </div>
        </section>

        <aside className="summary-panel">
          <div className="summary-card">
            <div className="summary-title-row">
              <div>
                <h2>Order summary</h2>
              </div>
              <span>{cartItems.length} item{cartItems.length !== 1 && 's'}</span>
            </div>

            {cartItems.length > 0 ? (
              <div className="summary-items-wrapper">
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${item.size || 'default'}-${index}`} className="summary-item-card">
                    <div className="summary-item-image-wrap">
                      <img src={item.image} alt={item.name} />
                      {item.quantity > 1 && (
                        <span className="summary-item-count">{item.quantity}</span>
                      )}
                    </div>
                    <div>
                      <p className="summary-item-name">{item.name}</p>
                      {item.size && <p className="summary-item-weight">{item.size}</p>}
                      <p className="summary-item-meta">
                        Delivery Date: {formatToDDMMYYYY(item.delivery?.deliveryDate) || 'N/A'}
                      </p>
                      <p className="summary-item-meta">
                        Delivery Slot: {item.delivery?.deliveryTime || 'N/A'}
                      </p>
                    </div>
                    <strong>₹ {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-summary">Your cart is empty.</p>
            )}

            <div className="discount-box">
              <input
                type="text"
                value={discountCode}
                onChange={(event) => setDiscountCode(event.target.value)}
                placeholder="Discount code or gift card"
              />
              <button type="button">Apply</button>
            </div>

            <div className="summary-row">
              <span>Subtotal · {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</span>
              <strong>₹ {totalPrice.toLocaleString()}</strong>
            </div>
            <div className="summary-row small">
              <span>Shipping</span>
              <span>Free Delivery</span>
              {/* <strong>₹ {shippingFee.toLocaleString()}</strong> */}

            </div>
            <div className="summary-total-row">
              <span>Total</span>
              <strong>INR ₹ {totalWithTax.toLocaleString()}</strong>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
