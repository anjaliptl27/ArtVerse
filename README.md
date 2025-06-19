# ArtVerse: Where Art Meets Community 🎨

Hey there! I'm Anjali, the creator behind ArtVerse. This is my hobby project.
ArtVerse is a comprehensive digital platform that connects art enthusiasts with talented artists worldwide. It serves as both a marketplace for buying/selling artwork and a learning platform for art education.

## Motivation and purpose

As both an artist and developer, I noticed three critical gaps in the digital art space:

- Fragmented platforms - Small artists juggle multiple sites for selling work, selling courses, and no platform for commission posting
- Limited discovery - Buyers struggle to find authentic art, browse suitable artists to request commissioned artwork and learning resources in one place
- Financial barriers - Emerging artists face high commission fees on existing platforms

ArtVerse solves these problems by creating an integrated ecosystem where artists can monetize their skills through multiple channels while buyers enjoy seamless access to both artwork and education.

## Behind the Scenes 🛠️

Building this has been equal parts exhilarating and frustrating. Some real talk:

**Wins I'm Proud Of:**
- Built a commission system that protects both artists and buyers

**Hard Lessons Learned:**
- Image uploads will test your patience (Cloudinary saved me)
- Authentication is way more complex than tutorials suggest

## Features That Actually Help People

### For Artists:
- **Your All-in-One Hub** - Sell originals, take commissions, and teach - all from one profile
- **Keep More Earnings** - Only 10% platform fee (compare that to 30-50% elsewhere) that too when you sale!

### For Art Lovers:
- **Discover + Learn** - Find amazing art, then learn how it's made from the same artist
- **Commission with Confidence** - Clear pricing, timelines, and progress tracking


## Technologies Used
### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API requests
- React Icons for vector icons

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Cloudinary for image storage

## Try It Out Yourself

Getting started is simple:

-- Prerequisites

1. Node.js (v16+)
2. npm or yarn
3. MongoDB Atlas account or local MongoDB instance
4. Cloudinary account (for image storage)

```bash
# Clone the repo
git clone https://github.com/yourusername/artverse.git

# Install dependencies
cd artverse/client && npm install
cd ../server && npm install

# Set up your .env files (I've included examples)
# Then run:
npm run dev
```

## Usage Examples

- For Artists:
```bash 
1. Create profile
2. Upload portfolio
3. Set up commission options
4. Create courses
```
- For Buyers:
```bash
1. Browse artwork
2. Add to wishlist and/or cart
3. Request commissions by browsing artist profiles
4. Enroll in courses(free as of for now as payment system not implemented yet)
```

## Possible Future Implementations 🔮

1. Payment Integration (Planned for Q4 2023)
   a. Secure checkout system
   b. Multiple payment methods (credit cards, PayPal)
   c. Payout system for artists
2. Live Workshops
3. Mobile App

Anjali.  
Developer, ArtVerse 💖
