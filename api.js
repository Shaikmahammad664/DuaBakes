// API Configuration
const API_BASE_URL = 'http://localhost:7788';

// Signup endpoint
async function signup(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                FirstName: formData.firstName,
                LastName: formData.lastName,
                Email: formData.email,
                Password: formData.password,
                PhoneNumber: formData.phone
            })
        });
        
        const data = await response.json();
        console.log('Signup response:', data);
        return data;
    } catch (error) {
        console.error('Signup error:', error);
        return { status: 'Error', message: error.message };
    }
}

// Login endpoint
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Email: email,
                Password: password
            })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { status: 'Error', message: error.message };
    }
}

// Forgot Password endpoint
async function forgotPassword(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Email: email
            })
        });
        
        const data = await response.json();
        console.log('Forgot password response:', data);
        return data;
    } catch (error) {
        console.error('Forgot password error:', error);
        return { status: 'Error', message: error.message };
    }
}

// Reset Password endpoint
async function resetPassword(email, newPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Email: email,
                NewPassword: newPassword
            })
        });
        
        const data = await response.json();
        console.log('Reset password response:', data);
        return data;
    } catch (error) {
        console.error('Reset password error:', error);
        return { status: 'Error', message: error.message };
    }
}

// Admin Login endpoint
async function adminLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Email: email,
                Password: password
            })
        });
        
        const data = await response.json();
        console.log('Admin login response:', data);
        return data;
    } catch (error) {
        console.error('Admin login error:', error);
        return { status: 'Error', message: error.message };
    }
}

// Add Products endpoint
async function addProduct(productData) {
    try {
        const response = await fetch(`${API_BASE_URL}/AddProducts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        console.log('Add product response:', data);
        return data;
    } catch (error) {
        console.error('Add product error:', error);
        return { status: 'Error', message: error.message };
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', () => {
    // Signup form handler
    const signupForm = document.querySelector('form');
    if (signupForm && document.querySelector('h2')?.textContent.includes('Signup')) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('name').value,
                password: document.getElementById('password').value,
                phone: document.getElementById('phone').value
            };
            
            const result = await signup(formData);
            alert(result.status || 'Signup completed');
        });
    }
    
    // Login form handler
    if (signupForm && document.querySelector('h2')?.textContent.includes('Login')) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('name').value;
            const password = document.getElementById('password').value;
            
            const result = await login(email, password);
            alert(result.status || 'Login completed');
        });
    }
});
