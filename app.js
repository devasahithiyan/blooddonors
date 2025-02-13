// app.js

// Import Firebase modules (using Firebase v9 modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { 
  getFirestore, collection, getDocs, addDoc, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAs2h_c1EVgnRNRPT4z8IJpW-1240X7bNg",
  authDomain: "blood-donors-818a8.firebaseapp.com",
  projectId: "blood-donors-818a8",
  storageBucket: "blood-donors-818a8.firebasestorage.app",
  messagingSenderId: "779264359023",
  appId: "1:779264359023:web:431aa8b6f90a434ad4ab9a",
  measurementId: "G-4VJT4W3YTE"
};

// Initialize Firebase
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);

// Global arrays to hold fetched data
let donorsData = [];
let requestsData = [];

// For pagination / partial listing
let donorsPerLoad = 6;  // Show 6 donors at a time
let donorsCurrentlyShowing = 0;  // how many donors are currently displayed

// -----------------------------
// Name Sets (Separate for Donors & Requests)
// -----------------------------
const donorFirstNames = [
  "Arun", "Bala", "Chandran", "Dhinesh", "Elangovan", "Farook", "Gopinath", "Harish",
  "Iniyan", "Jagan", "Kalaivanan", "Loganathan", "Mathivanan", "Naveen", "Oviya",
  "Prakash", "Quadir", "Ragavan", "Surya", "Tamilvanan"
];
const donorLastNames = [
  "Kumar", "Sundaram", "Velu", "Muthu", "Krishnan", "Rajan", "Ravi", "Sethupathi", 
  "Murugan", "Jayaseelan", "Varadhan"
];
const requestFirstNames = [
  "Akila", "Bharathi", "Chitra", "Dharshan", "Eashwar", "Farzana", "Gautham", "Hema",
  "Ishwarya", "Jayashree", "Kala", "Lavanya", "Manikandan", "Navaneeth", "Oormila",
  "Pradeep", "Qamar", "Reena", "Subash", "Tharani"
];
const requestLastNames = [
  "Devi", "Palani", "Sekar", "Premkumar", "Balasubramaniam", "Anbalagan", "Srinivasan",
  "Kaliyaperumal", "Varadarajan", "Thangaraj", "Eswaran"
];
const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const locations = [
  "Peelamedu", "R.S. Puram", "Saravanampatti", 
  "Singanallur", "Gandhipuram", "Ukkadam"
];

// -----------------------------
// Sample Data Generation
// -----------------------------
function generateRandomDonor() {
  const firstName = donorFirstNames[Math.floor(Math.random() * donorFirstNames.length)];
  const lastName = donorLastNames[Math.floor(Math.random() * donorLastNames.length)];
  const name = firstName + " " + lastName;
  const email = (firstName + lastName + Math.floor(Math.random() * 1000) + "@example.com").toLowerCase();
  const phone = "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
  const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;
  const bg = bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
  const loc = locations[Math.floor(Math.random() * locations.length)];
  return { name, email, phone, age, bloodGroup: bg, location: loc };
}

function generateRandomRequest() {
  const firstName = requestFirstNames[Math.floor(Math.random() * requestFirstNames.length)];
  const lastName = requestLastNames[Math.floor(Math.random() * requestLastNames.length)];
  const name = firstName + " " + lastName;
  const email = (firstName + lastName + Math.floor(Math.random() * 1000) + "@example.com").toLowerCase();
  const phone = "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
  const bg = bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
  const loc = locations[Math.floor(Math.random() * locations.length)];
  const messages = ["Urgent need", "Please help", "Critical condition", "Need blood ASAP", "Emergency"];
  const message = messages[Math.floor(Math.random() * messages.length)];
  const timestamp = Date.now() - Math.floor(Math.random() * 1000000000);
  const status = "complete";
  return { name, email, phone, bloodGroup: bg, location: loc, message, timestamp, status };
}

// -----------------------------
// Seeding Functions
// -----------------------------
async function seedDonors() {
  const donorsSnapshot = await getDocs(collection(db, "donors"));
  if (donorsSnapshot.size < 50) {
    // You can adjust the seeding logic as needed
    const donorsToAdd = 50 - donorsSnapshot.size;
    for (let i = 0; i < donorsToAdd; i++) {
      await addDoc(collection(db, "donors"), generateRandomDonor());
    }
  }
}

async function seedRequests() {
  const requestsSnapshot = await getDocs(collection(db, "requests"));
  if (requestsSnapshot.size < 10) {
    const requestsToAdd = 10 - requestsSnapshot.size;
    for (let i = 0; i < requestsToAdd; i++) {
      await addDoc(collection(db, "requests"), generateRandomRequest());
    }
  }
}

// -----------------------------
// Fetching Data
// -----------------------------
async function fetchDonors() {
  const donorsSnapshot = await getDocs(collection(db, "donors"));
  donorsData = [];
  donorsSnapshot.forEach(doc => {
    donorsData.push({ ...doc.data(), id: doc.id });
  });
}

async function fetchRequests() {
  const requestsSnapshot = await getDocs(collection(db, "requests"));
  requestsData = [];
  requestsSnapshot.forEach(doc => {
    requestsData.push({ ...doc.data(), id: doc.id });
  });
}

// -----------------------------
// Donor Rendering with "Load More"
// -----------------------------
function renderDonors(loadNew=false) {
  const donorListDiv = document.getElementById('donorList');
  const loadMoreBtn = document.getElementById('loadMoreDonorsBtn');
  const filterBloodGroup = document.getElementById('filterBloodGroup').value;
  const filterLocation = document.getElementById('filterLocation').value;
  const searchName = document.getElementById('searchName').value.toLowerCase();
  
  // If filters changed or search input changed, reset how many donors are shown
  if(!loadNew){
    donorsCurrentlyShowing = 0;
  }

  // Filter the donors
  const filteredDonors = donorsData.filter(donor => {
    const matchesBlood = (filterBloodGroup === 'all' || donor.bloodGroup === filterBloodGroup);
    const matchesLocation = (filterLocation === 'all' || donor.location === filterLocation);
    const matchesName = donor.name.toLowerCase().includes(searchName);
    return matchesBlood && matchesLocation && matchesName;
  });

  // If not "loadNew", re-initialize container
  if(!loadNew){
    donorListDiv.innerHTML = '';
  }

  // Next chunk of donors from the filtered array
  const nextBatch = filteredDonors.slice(donorsCurrentlyShowing, donorsCurrentlyShowing + donorsPerLoad);

  nextBatch.forEach(donor => {
    const card = document.createElement('div');
    card.className = 'donor-card';
    card.innerHTML = `
      <h3>${donor.name}</h3>
      <p><strong>Blood Group:</strong> ${donor.bloodGroup}</p>
      <p><strong>Location:</strong> ${donor.location}</p>
      <p><strong>Phone:</strong> ${donor.phone}</p>
    `;
    card.addEventListener('click', () => { showDonorDetails(donor); });
    donorListDiv.appendChild(card);
  });

  // Update how many we've shown so far
  donorsCurrentlyShowing += nextBatch.length;

  // Show or hide the "Load More" button
  if (donorsCurrentlyShowing >= filteredDonors.length) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'block';
  }

  // If there's no donors matching filters
  if (filteredDonors.length === 0) {
    donorListDiv.innerHTML = '<p>No donors found matching the criteria.</p>';
    loadMoreBtn.style.display = 'none';
  }
}

// -----------------------------
// Requests Rendering
// -----------------------------
function renderRequests() {
  const requestListDiv = document.getElementById('requestList');
  requestListDiv.innerHTML = '';
  if (requestsData.length === 0) {
    requestListDiv.innerHTML = '<p>No recent blood requests.</p>';
    return;
  }
  // Sort requests by timestamp descending
  const sortedRequests = requestsData.sort((a, b) => b.timestamp - a.timestamp);
  sortedRequests.forEach(req => {
    const card = document.createElement('div');
    card.className = 'request-card';
    card.innerHTML = `
      <h4>${req.name} - <span>${req.bloodGroup}</span></h4>
      <p><strong>Location:</strong> ${req.location}</p>
      ${req.message ? `<p><strong>Message:</strong> ${req.message}</p>` : ''}
      <p><strong>Status:</strong> ${req.status}</p>
    `;
    if (req.status === 'pending') {
      const helpBtn = document.createElement('button');
      helpBtn.className = 'btn help-btn';
      helpBtn.innerText = 'Help';
      helpBtn.addEventListener('click', () => {
        updateRequestStatus(req.id, 'helped');
      });
      card.appendChild(helpBtn);
    } else if (req.status === 'helped') {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn close-btn';
      closeBtn.innerText = 'Close Request';
      closeBtn.addEventListener('click', () => {
        updateRequestStatus(req.id, 'closed');
      });
      card.appendChild(closeBtn);
    }
    requestListDiv.appendChild(card);
  });
}

// -----------------------------
// Stats Animation
// -----------------------------
let statsAnimated = false;
function animateCounter(element, start, end, duration) {
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const current = Math.min(Math.floor((progress / duration) * (end - start) + start), end);
    element.innerText = current;
    if (progress < duration) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

function runStatsAnimation() {
  if (statsAnimated) return;
  statsAnimated = true;
  animateCounter(document.getElementById('donorCount'), 0, donorsData.length, 1500);
  animateCounter(document.getElementById('requestCount'), 0, requestsData.length, 1500);
  animateCounter(document.getElementById('livesSaved'), 0, 23, 1500);
}

// -----------------------------
// Modal Functions
// -----------------------------
function showDonorDetails(donor) {
  const modal = document.getElementById('donorModal');
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <h3>${donor.name}</h3>
    <p><strong>Email:</strong> ${donor.email}</p>
    <p><strong>Phone:</strong> ${donor.phone}</p>
    <p><strong>Age:</strong> ${donor.age}</p>
    <p><strong>Blood Group:</strong> ${donor.bloodGroup}</p>
    <p><strong>Location:</strong> ${donor.location}</p>
  `;
  modal.style.display = 'block';
}
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('donorModal').style.display = 'none';
});
window.addEventListener('click', (event) => {
  const modal = document.getElementById('donorModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// -----------------------------
// Update Request Status
// -----------------------------
async function updateRequestStatus(requestId, newStatus) {
  try {
    const requestRef = doc(db, "requests", requestId);
    await updateDoc(requestRef, { status: newStatus });
    alert(`Request updated to "${newStatus}"`);
    await fetchRequests();
    renderRequests();
  } catch (error) {
    console.error("Error updating request status: ", error);
    alert('Error updating request status.');
  }
}

// -----------------------------
// Form Submission Handlers
// -----------------------------
document.getElementById('donorForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('donorName').value.trim();
  const email = document.getElementById('donorEmail').value.trim();
  const phone = document.getElementById('donorPhone').value.trim();
  const age = parseInt(document.getElementById('donorAge').value);
  const bloodGroup = document.getElementById('donorBloodGroup').value;
  const location = document.getElementById('donorLocation').value;
  
  if(name && email && phone && age && bloodGroup && location) {
    try {
      await addDoc(collection(db, "donors"), { 
        name, email, phone, age, bloodGroup, location 
      });
      alert('Thank you for registering as a donor!');
      document.getElementById('donorForm').reset();
      await fetchDonors();
      // reset offset and re-render
      donorsCurrentlyShowing = 0;
      renderDonors();
    } catch (error) {
      console.error("Error adding donor: ", error);
      alert('Error registering donor. Please try again.');
    }
  } else {
    alert('Please fill in all required fields.');
  }
});

document.getElementById('requestForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('requestName').value.trim();
  const email = document.getElementById('requestEmail').value.trim();
  const phone = document.getElementById('requestPhone').value.trim();
  const bloodGroup = document.getElementById('requestBloodGroup').value;
  const location = document.getElementById('requestLocation').value;
  const message = document.getElementById('requestMessage').value.trim();
  const timestamp = Date.now();
  const status = "pending";
  
  if(name && email && phone && bloodGroup && location) {
    try {
      await addDoc(collection(db, "requests"), {
        name, email, phone, bloodGroup, location, message, timestamp, status
      });
      alert('Your blood request has been submitted. We will contact you shortly.');
      document.getElementById('requestForm').reset();
      await fetchRequests();
      renderRequests();
    } catch (error) {
      console.error("Error adding request: ", error);
      alert('Error submitting request. Please try again.');
    }
  } else {
    alert('Please fill in all required fields.');
  }
});

// -----------------------------
// Filtering Event Listeners
// -----------------------------
document.getElementById('filterBloodGroup').addEventListener('change', () => renderDonors(false));
document.getElementById('filterLocation').addEventListener('change', () => renderDonors(false));
document.getElementById('searchName').addEventListener('input', () => renderDonors(false));

// -----------------------------
// "Load More" Donors
// -----------------------------
document.getElementById('loadMoreDonorsBtn').addEventListener('click', () => {
  renderDonors(true);
});

// -----------------------------
// Mobile Menu Toggle
// -----------------------------
const mobileMenu = document.getElementById('mobileMenu');
const navLinks = document.getElementById('navLinks');
mobileMenu.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});
// Close menu when a nav link is clicked (on mobile)
navLinks.addEventListener('click', (e) => {
  if(e.target.tagName === 'A') {
    navLinks.classList.remove('active');
  }
});

// -----------------------------
// Back to Top
// -----------------------------
const backToTop = document.getElementById('backToTop');
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTop.style.display = 'block';
  } else {
    backToTop.style.display = 'none';
  }
});

// -----------------------------
// Initialization
// -----------------------------
async function initializeData() {
  // Seeding logic (comment out if you don't want auto seeding)
  await seedDonors();
  await seedRequests();

  // Fetch data from Firestore
  await fetchDonors();
  await fetchRequests();

  // Render donors & requests
  renderDonors();
  renderRequests();

  // Animate stats once after data is ready
  runStatsAnimation();
}

window.addEventListener('load', initializeData);
