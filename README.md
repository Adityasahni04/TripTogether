# **TripTogether**  
*A platform to connect travel enthusiasts, share experiences, and discover hidden gems in a single place.*

## **Overview**  
People passionate about travel often struggle to find like-minded individuals or reliable local insights when visiting a new place. *TravelMate* solves this by enabling travelers to create groups, connect with others nearby, and exchange information about hidden gems—all within a single platform, eliminating the need to browse multiple websites.

## **Features**  
- **Group Creation**: Easily create or join travel groups based on interests or locations.  
- **Real-Time Connections**: Connect with people who are currently in the same area.  
- **Hidden Gems Sharing**: Share and discover off-the-beaten-path places and experiences.  
- **Secure Authentication**:  
  - Passwords are encrypted using **bcrypt** for added security.  
  - Token-based authentication using **JWT** ensures safe and stateless user sessions.  
- **Real-Time Communication**: Chat with other travelers in real time using **WebSocket**.

## **Tech Stack**  
- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Node.js, Express.js  
- **Database**: MongoDB
- **Authentication**: bcrypt, JWT  
- **Real-Time Communication**: WebSocket  
- **Hosting**: AWS 
- **Version Control**: Git & GitHub

## **Installation**  
1. Clone the repository:
   ```bash
   git clone https://github.com/Adityasahni04/TripTogether.git
   cd TripTogether
   ```

---

2. Install dependencies:
   ```bash
   npm install
   ```

---

3. Create a `.env` file and add the following environment variables:
   ```bash
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   DB_URI=your_database_uri
   ```

---

4. Start the server:
   ```bash
   npm start
   ```

---

5. Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

---

## **Contact**  
Feel free to reach out if you have any questions or suggestions!  
**Email:** [sahniaditya951@gmail.com](mailto:sahniaditya951@gmail.com)  
**LinkedIn:** [Aditya Sahni](https://www.linkedin.com/in/adityasahni04/)  

---
