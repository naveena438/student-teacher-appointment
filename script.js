// Global variables
let currentUser = null;
let teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        redirectToDashboard();
        return;
    }

    // Set up event listeners
    setupEventListeners();
    
    // Show login section by default
    showSection('login');
}

function setupEventListeners() {
    // Navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            navButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Show/hide teacher fields based on role selection
        const roleSelect = document.getElementById('register-role');
        roleSelect.addEventListener('change', function() {
            const teacherFields = document.getElementById('teacher-fields');
            if (this.value === 'teacher') {
                teacherFields.style.display = 'block';
                document.getElementById('register-subject').required = true;
            } else {
                teacherFields.style.display = 'none';
                document.getElementById('register-subject').required = false;
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function showSection(section) {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    if (section === 'login') {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
    } else {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const role = document.getElementById('register-role').value;
    const name = document.getElementById('register-name').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const subject = document.getElementById('register-subject').value;

    // Validate input
    if (!role || !name || !username || !password) {
        alert('Please fill in all required fields');
        return;
    }

    if (role === 'teacher' && !subject) {
        alert('Please enter your subject');
        return;
    }

    // Check if username already exists
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (allUsers.find(user => user.username === username)) {
        alert('Username already exists. Please choose a different username.');
        return;
    }

    // Create user object
    const user = {
        id: Date.now().toString(),
        role,
        name,
        username,
        password,
        subject: role === 'teacher' ? subject : null
    };

    // Save user
    allUsers.push(user);
    localStorage.setItem('users', JSON.stringify(allUsers));

    // If teacher, add to teachers list
    if (role === 'teacher') {
        teachers.push({
            id: user.id,
            name: user.name,
            username: user.username,
            subject: user.subject,
            availableSlots: []
        });
        localStorage.setItem('teachers', JSON.stringify(teachers));
    }

    alert('Registration successful! Please login.');
    showSection('login');
    
    // Clear form
    document.getElementById('register-form').reset();
}

function handleLogin(e) {
    e.preventDefault();
    
    const role = document.getElementById('login-role').value;
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Validate input
    if (!role || !username || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Check credentials
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = allUsers.find(u => 
        u.username === username && 
        u.password === password && 
        u.role === role
    );

    if (!user) {
        alert('Invalid credentials. Please try again.');
        return;
    }

    // Login successful
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    redirectToDashboard();
}

function redirectToDashboard() {
    if (currentUser.role === 'student') {
        window.location.href = 'student-dashboard.html';
    } else {
        window.location.href = 'teacher-dashboard.html';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'index.html';
}

// Dashboard functions
function loadStudentDashboard() {
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    displayTeachers();
    displayStudentAppointments();
}

function loadTeacherDashboard() {
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    displayTeacherSlots();
    displayAppointmentRequests();
    displayTeacherSchedule();
}

function displayTeachers() {
    const teacherList = document.getElementById('teacher-list');
    if (!teacherList) return;

    const searchTerm = document.getElementById('search-teacher')?.value.toLowerCase() || '';
    const filteredTeachers = teachers.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm) ||
        teacher.subject.toLowerCase().includes(searchTerm)
    );

    teacherList.innerHTML = filteredTeachers.map(teacher => `
        <div class="teacher-card">
            <h3>${teacher.name}</h3>
            <p><strong>Subject:</strong> ${teacher.subject}</p>
            <p><strong>Available Slots:</strong> ${teacher.availableSlots.length}</p>
            <button class="btn btn-book" onclick="bookAppointment('${teacher.id}')">
                Book Appointment
            </button>
        </div>
    `).join('');
}

function displayStudentAppointments() {
    const appointmentsContainer = document.getElementById('student-appointments');
    if (!appointmentsContainer) return;

    const studentAppointments = appointments.filter(apt => apt.studentId === currentUser.id);
    
    if (studentAppointments.length === 0) {
        appointmentsContainer.innerHTML = '<p>No appointments found.</p>';
        return;
    }

    appointmentsContainer.innerHTML = studentAppointments.map(apt => {
        const teacher = teachers.find(t => t.id === apt.teacherId);
        const statusClass = status-${apt.status.toLowerCase()};
        
        return `
            <div class="appointment-card">
                <h3>Appointment with ${teacher ? teacher.name : 'Unknown Teacher'}</h3>
                <p><strong>Date:</strong> ${new Date(apt.dateTime).toLocaleString()}</p>
                <p><strong>Subject:</strong> ${teacher ? teacher.subject : 'N/A'}</p>
                <span class="status ${statusClass}">${apt.status}</span>
                ${apt.status === 'Pending' ? 
                    <button class="btn btn-cancel" onclick="cancelAppointment('${apt.id}')">Cancel</button> : 
                    ''
                }
            </div>
        `;
    }).join('');
}

function displayTeacherSlots() {
    const slotList = document.getElementById('slot-list');
    if (!slotList) return;

    const teacher = teachers.find(t => t.id === currentUser.id);
    if (!teacher) return;

    slotList.innerHTML = teacher.availableSlots.map(slot => `
        <div class="slot-card">
            <h3>Available Slot</h3>
            <p><strong>Date:</strong> ${new Date(slot.dateTime).toLocaleString()}</p>
            <button class="btn btn-cancel" onclick="removeSlot('${slot.id}')">Remove Slot</button>
        </div>
    `).join('');
}

function displayAppointmentRequests() {
    const requestsContainer = document.getElementById('appointment-requests');
    if (!requestsContainer) return;

    const teacherRequests = appointments.filter(apt => 
        apt.teacherId === currentUser.id && apt.status === 'Pending'
    );

    if (teacherRequests.length === 0) {
        requestsContainer.innerHTML = '<p>No pending requests.</p>';
        return;
    }

    requestsContainer.innerHTML = teacherRequests.map(apt => {
        const student = JSON.parse(localStorage.getItem('users') || '[]')
            .find(u => u.id === apt.studentId);
        
        return `
            <div class="appointment-card">
                <h3>Request from ${student ? student.name : 'Unknown Student'}</h3>
                <p><strong>Date:</strong> ${new Date(apt.dateTime).toLocaleString()}</p>
                <button class="btn btn-approve" onclick="updateAppointmentStatus('${apt.id}', 'Approved')">
                    Approve
                </button>
                <button class="btn btn-reject" onclick="updateAppointmentStatus('${apt.id}', 'Rejected')">
                    Reject
                </button>
            </div>
        `;
    }).join('');
}

function displayTeacherSchedule() {
    const scheduleContainer = document.getElementById('teacher-schedule');
    if (!scheduleContainer) return;

    const teacherAppointments = appointments.filter(apt => 
        apt.teacherId === currentUser.id && apt.status === 'Approved'
    );

    if (teacherAppointments.length === 0) {
        scheduleContainer.innerHTML = '<p>No scheduled appointments.</p>';
        return;
    }

    scheduleContainer.innerHTML = teacherAppointments.map(apt => {
        const student = JSON.parse(localStorage.getItem('users') || '[]')
            .find(u => u.id === apt.studentId);
        
        return `
            <div class="appointment-card">
                <h3>Scheduled with ${student ? student.name : 'Unknown Student'}</h3>
                <p><strong>Date:</strong> ${new Date(apt.dateTime).toLocaleString()}</p>
            </div>
        `;
    }).join('');
}

// Action functions
function bookAppointment(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher || teacher.availableSlots.length === 0) {
        alert('No available slots for this teacher.');
        return;
    }

    // For simplicity, book the first available slot
    const slot = teacher.availableSlots[0];
    
    const appointment = {
        id: Date.now().toString(),
        studentId: currentUser.id,
        teacherId: teacherId,
        dateTime: slot.dateTime,
        status: 'Pending',
        createdAt: new Date().toISOString()
    };

    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));

    // Remove the slot from teacher's available slots
    teacher.availableSlots = teacher.availableSlots.filter(s => s.id !== slot.id);
    localStorage.setItem('teachers', JSON.stringify(teachers));

    alert('Appointment requested successfully!');
    displayTeachers();
    displayStudentAppointments();
}

function cancelAppointment(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Add the slot back to teacher's available slots
    const teacher = teachers.find(t => t.id === appointment.teacherId);
    if (teacher) {
        teacher.availableSlots.push({
            id: Date.now().toString(),
            dateTime: appointment.dateTime
        });
        localStorage.setItem('teachers', JSON.stringify(teachers));
    }

    // Remove appointment
    appointments = appointments.filter(apt => apt.id !== appointmentId);
    localStorage.setItem('appointments', JSON.stringify(appointments));

    alert('Appointment cancelled successfully!');
    displayStudentAppointments();
}

function updateAppointmentStatus(appointmentId, status) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    appointment.status = status;
    localStorage.setItem('appointments', JSON.stringify(appointments));

    alert(Appointment ${status.toLowerCase()} successfully!);
    displayAppointmentRequests();
    displayTeacherSchedule();
}

function addSlot() {
    const dateTimeInput = document.getElementById('slot-datetime');
    const dateTime = dateTimeInput.value;
    
    if (!dateTime) {
        alert('Please select a date and time.');
        return;
    }

    const teacher = teachers.find(t => t.id === currentUser.id);
    if (!teacher) return;

    const newSlot = {
        id: Date.now().toString(),
        dateTime: dateTime
    };

    teacher.availableSlots.push(newSlot);
    localStorage.setItem('teachers', JSON.stringify(teachers));

    alert('Slot added successfully!');
    dateTimeInput.value = '';
    displayTeacherSlots();
}

function removeSlot(slotId) {
    const teacher = teachers.find(t => t.id === currentUser.id);
    if (!teacher) return;

    teacher.availableSlots = teacher.availableSlots.filter(slot => slot.id !== slotId);
    localStorage.setItem('teachers', JSON.stringify(teachers));

    alert('Slot removed successfully!');
    displayTeacherSlots();
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-teacher');
    if (searchInput) {
        searchInput.addEventListener('input', displayTeachers);
    }
}

// Initialize dashboard based on current page
if (window.location.pathname.includes('student-dashboard')) {
    loadStudentDashboard();
    setupSearch();
} else if (window.location.pathname.includes('teacher-dashboard')) {
    loadTeacherDashboard();
}
