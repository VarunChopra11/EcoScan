# Reewild - Full Stack Engineer Take Home Challenge

## 💡 EcoScan - Clothing Carbon Footprint Scanner

### Overview

This take-home assignment involves hacking a web application, **EcoScan**, that scans and assesses the carbon footprint of clothing items. This app will empower users to understand the environmental impact of their clothing choices by displaying carbon scores for each item and providing eco-reward points based on their eco-savings. The goal is to assess your ability to develop both the backend and front end while showcasing your product design and technical vision. 

---

### Challenge Brief

You will build a web app with the following:

- **Frontend**: User interface for uploading images by file upload or from camera directly, viewing item details, carbon scores, eco-reward points, and available offers.
- **Backend**: API to handle image recognition, carbon score calculation, and eco-reward points based on clothing items.

**Technical Stack**:

- **Frontend**: React / React Native/ Streamlit / anything you think is sick 🔥
- **Backend**: Any backend framework of your choice (Python, .NET, Javascript/Typescript preffered)
- **Image Recognition**: Using OpenAI’s GPT-4 Vision model or any open source available models (or a mock function if necessary)

---

### User Story

1. The user uploads a picture of their clothing item(s) (either image file or from taking a snap from camera directly 📸).
2. The app identifies the clothing items in the image.
3. For each item, an estimated carbon footprint is calculated.
4. The total carbon score is displayed, along with eco-reward points based on the eco-savings.
5. Offers available for redemption appear based on the user's eco-reward points.

You have full creative freedom to shape as you like, have fun! 🌱🚀

---

### Requirements

### 1. **Frontend Requirements**

- A clean, user-friendly UI for:
    - Uploading or capturing a picture of clothing items.
    - Viewing identified items, their estimated carbon footprint, and total eco-reward points.
    - Viewing available offers that users can redeem based on their eco-reward points.

### 2. **Backend Requirements**

- API Endpoints:
    - **Image Analysis Endpoint**: Accepts an image, recognizes clothing items, and returns identified items with their estimated carbon scores.
    - **Eco-Score Calculation**: Based on the items, calculate the carbon footprint and assign eco-reward points.
    - **Offers Retrieval**: Based on the user’s points, retrieve offers they can redeem.
- **Carbon Score Assumptions**:
    - Define basic assumptions for each clothing item's carbon footprint (e.g., T-shirt = 5 kg CO₂, Jeans = 10 kg CO₂).
    - Use an in-memory store (e.g., dictionary) to store carbon scores for various items.

### 3. **Technical Requirements**

- No database required; use in-memory storage.
- Basic unit tests covering core functionalities.
- Error handling for common scenarios (e.g., invalid image upload).

### 4. **Documentation**

- **README**: Detailed instructions for setting up, running, and testing the application.
- Explanation of carbon footprint assumptions.
- A proposal for potential product and technical enhancements.

---

### Enhancements

In the README, include a proposal on how you would:

- Scale the backend for larger user loads.
- Improve the carbon scoring model by incorporating more detailed data.
- Enhance the user experience with additional insights (e.g., sustainability comparisons).
- Integrate the solution with external APIs for real-time data.

---

### Submission Guidelines

1. **GitHub Repository**:
    - Create a GitHub repository with a suitable name.
    - Commit all source code, tests, and documentation to this repository.
    - The `README.md` should include:
        - Setup and installation instructions.
        - Details about the assumptions for carbon scoring.
        - Instructions to run the application and tests locally.
        - Information on deployment (if applicable).
2. **Documentation in README.md**:
    - **Setup Instructions**: Detailed steps to install dependencies, configure environment variables, and start the application.
    - **Run Instructions**: Information on accessing the application locally, including URLs.
    - **Enhancement Proposals**: Include sections on both **Product Improvements** and **Technical Scaling** for future development.
3. **Deployment** **(Optional)**:
    - If possible, deploy the application to a platform like Azure, Vercel, Heroku, or Streamlit’s cloud service.
    - Provide the deployment link in the README if available.
4. **Video (Optional):** 
    - Include a video recording of your solution if you want to showcase the working demo. You can use tools like loom or just send via the submission email.

Additional Pointers:

1. **Tools**: You can use any tools or libraries you choose to build the application, including frameworks or services for image recognition, storage, or front-end functionality.
2. **Documentation**: Include a `README.md` in your GitHub repository with detailed setup instructions, a brief explanation of your code structure, and any assumptions or design decisions you've made throughout the project.
3. **Carbon Score & Eco-Reward Logic**: While exact carbon scores per clothing item may be estimated, ensure your code structure allows easy updates or potential integrations with accurate data sources for a more dynamic approach in the future.
4. **Enhancements and Scalability**: In the documentation, suggest any improvements to make this a more effective and scalable application, including ideas for user experience, handling high traffic, or extending functionality. Outline any choices you’d consider if this were a production application.
5. **Deployment**: Deploying the application is optional, but please include the link in your submission if you choose to.
6. **Submission Format**: Please share a GitHub repository link to submit your final project. Include any supplementary files or documentation you find useful for reviewers.

**Questions**: For questions about the challenge, role, or Reewild, reach out anytime.

Please send an email with your GitHub repository and your resume to **rithin.chalumuri@reewild.com**. Looking forward to seeing the hack —have fun with it! 🌱

---

### Evaluation Criteria

- **Functionality**: Does the app meet the specified requirements, including accurate image upload, item recognition, and eco-score calculations?
- **Code Quality**: Is the code clean, modular, and well-structured?
- **Documentation**: Is the README detailed, easy to follow, and informative?
- **User Experience**: How intuitive and polished is the user interface?
- **Scalability and Product Vision**: Are the proposed enhancements realistic and valuable?

---

### Suggested GitHub README.md Structure

Please add and remove sections you think are appropriate. This is just a rough example. 

```jsx

# 🌍 EcoScan - Clothing Carbon Footprint Scanner

## 📜 Overview
EcoScan is a web application designed to help users understand the environmental impact of their clothing. By uploading images of clothing items, users can see estimated carbon scores, earn eco-reward points, and redeem sustainability-focused offers. This project demonstrates a full-stack solution for a green initiative product.

## 🔧 Tech Stack
- **Frontend**: React (or Streamlit)
- **Backend**: [Your preferred stack]
- **Image Recognition**: GPT-4 Vision API (or mock function for development)

---

## 🚀 Setup Instructions

1. **Clone the Repository**  
   First, clone the repository and navigate into the project directory:
   ```bash
   git clone https://github.com/your-username/eco-scan-challenge.git
   cd eco-scan-challenge
   ```

2. **Install Dependencies**  
   Run the following commands depending on your tech stack:
   ```bash
   npm install         # for frontend dependencies
   pip install -r requirements.txt   # if using Python for backend dependencies
   ```

3. **Run the Application**
   - **Backend**: Start the backend server:
     ```bash
     npm start   # or `python app.py` if using Python backend
     ```
   - **Frontend**: Start the frontend application:
     ```bash
     npm run start   # or `streamlit run app.py` if using Streamlit
     ```

4. **Testing**  
   Run the tests to verify the setup:
   ```bash
   npm test    # for frontend tests
   pytest      # if using Python backend
   ```

---

## 🌱 Carbon Score Assumptions

To calculate the environmental impact of each clothing item, we have assigned approximate carbon scores based on item type. These scores are stored in an in-memory dictionary for quick access.

| 👕 Item       | 🌍 Estimated Carbon Score (kg CO₂) |
|--------------|------------------------------------|
| T-shirt      | 5                                  |
| Jeans        | 10                                 |
| Jacket       | 15                                 |
| Shoes        | 8                                  |

---

## 🌟 Product & Technical Enhancements

In this section, suggest possible improvements that could make **EcoScan** a more effective and scalable solution.

1. **Scaling**: 🌐 Describe how the backend could be optimized for a large user base, using techniques like caching or database integration.
2. **Enhanced Eco-Score Model**: 📊 Outline ways to make carbon scoring more accurate by considering factors like materials, brand data, or garment condition.
3. **User Experience Improvements**: ✨ Suggest UI/UX features that provide more insights or interactive elements for users, like sustainability comparisons.
4. **API Integrations**: 🔌 Describe possible integrations with external carbon data sources for real-time accuracy.

---

## 📲 Deployment

If deployed, include a link here to access the live version of **EcoScan**.

- **URL**: [Insert deployment link here if deployed]

---

### Thank you for building a greener future with EcoScan! 🌍💚

```

---

[https://app.notion.com](https://app.notion.com)