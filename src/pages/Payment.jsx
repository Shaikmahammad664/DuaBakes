import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
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
    if (field === 'paymentMethod') {
      setPaymentConfirmed(false);
      setUpiId('');
      setUpiRedirect('');
    }
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

            <button type="button" className="pay-now-button" onClick={async () => {
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

              const updatedUser = {
                ...user,
                Email: email,
                email: email,
                firstName: form.firstName || user.firstName || user.FirstName || user.name,
                lastName: form.lastName || user.lastName || user.LastName,
                phone: form.phone || user.PhoneNumber || user.phone,
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
                addressHistory: [
                  ...(user.addressHistory || []),
                  {
                    createdAt: new Date().toISOString(),
                    shippingAddress,
                    billingAddress,
                  },
                ],
              };

              const userToStore = parsed.user ? { ...parsed, user: updatedUser } : updatedUser;
              localStorage.setItem('user', JSON.stringify(userToStore));

              try {
                await ordersAPI.create({
                  Email: email,
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
                setMessage('Could not place order right now.');
              }
            }}>
              Pay now
            </button>
            {message && <p className="payment-confirmation">{message}</p>}
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
              <span>Shipping (Serviced from Domlur, Bangalore)</span>
              <span>Enter shipping address</span>
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
