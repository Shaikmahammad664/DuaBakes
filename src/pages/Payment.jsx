import React, { useState } from 'react';
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

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 0;
  const totalWithTax = totalPrice + shippingFee;

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
                <button type="button" className="text-link" onClick={() => navigate('/login')}>Sign in</button>
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
              <div className="field-grid two-columns">
                <label className="field-label">
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

              const user = JSON.parse(storedUser);
              const email = user.Email || user.email;
              try {
                await ordersAPI.create({
                  Email: email,
                  Items: cartItems.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
                  TotalAmount: totalWithTax,
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
                <p className="summary-label">Summary</p>
                <h2>Order summary</h2>
              </div>
              <span>{cartItems.length} item{cartItems.length !== 1 && 's'}</span>
            </div>

            {cartItems.length > 0 ? (
              <div className="summary-item-card">
                <img src={cartItems[0].image} alt={cartItems[0].name} />
                <div>
                  <p className="summary-item-name">{cartItems[0].name}</p>
                  <p className="summary-item-meta">Delivery Date: Sat, 18 Jul 2026</p>
                  <p className="summary-item-meta">Delivery Slot: 11:00 AM - 12:00 PM</p>
                </div>
                <strong>Rs. {cartItems[0].price.toLocaleString()}</strong>
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
              <span>Subtotal</span>
              <strong>Rs. {totalPrice.toLocaleString()}</strong>
            </div>
            <div className="summary-row small">
              <span>Shipping</span>
              <span>Serviced from Domlur, Bangalore</span>
            </div>
            <div className="summary-total-row">
              <span>Total</span>
              <strong>INR Rs. {totalWithTax.toLocaleString()}</strong>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
