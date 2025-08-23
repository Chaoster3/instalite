# Pennstagram

Pennstagram is a social media platform designed to connect users through posts, comments, and real-time chat.

## Features

### Core Features
- **User Authentication**: Secure registration and login with session management.
- **Profile Management**: Create and edit user profiles.
- **Content Sharing**: Post, comment, and like content.
- **Feed and Recommendations**: Personalized feed and friend recommendations.
- **Federated Posts**: Integration with external applications for post sharing.
- **Real-time Chat**: WebSocket-based chat for instant messaging.
- **Search**: Dynamic search for posts and interests.

### Other Features
- **Friend Requests**: Send, accept, or decline friend requests.
- **Password Recovery**: "Forgot password" feature with email token for password reset.
- **Infinite Scrolling**: Continuous scrolling on the home feed.
- **Trending Posts**: Site-wide display of top trending posts.
- **LLM Search Results**: Direct interaction with search results.
- **Dynamic Interest Suggestions**: Real-time suggestions for user interests.

## Technology Stack

- **Backend**: Node.js, Express.js, AWS S3, Kafka, ChromaDB, Socket.io
- **Frontend**: React, Tailwind CSS
- **Database**: MySQL database in AWS RDS, with EC2 for SSH tunneling

## Source Files

- **Frontend**: All files in `/frontend/src` except `utils` and `assets` folders.
- **Backend**: 
  - Access Layer: `/backend/access`
  - Controllers: `/backend/controllers`
  - Chat: `/backend/chat`
  - Java Components: `/backend/java/edu/upenn/cis/nets2120`
  - Routes: `/backend/routes`
  - Additional files: `/backend/kafka.js`, `/backend/rag.js`, `/backend/server.js`
- **Jobs**: `/jobs/src/main/java/edu/upenn/cis/nets2120/hw3/FriendOfFriendsSpark`

## Running the Project

For detailed instructions on setting up and running the project, please refer to the [setup guide](https://docs.google.com/document/d/1B52ENyDP7s83Ol720d1F9sDJc5rxsPBhvCvX5Ikj77s/edit?usp=sharing).

