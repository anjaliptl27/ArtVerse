import {Request, Response} from 'express';
const express = require('express');
const router = express.Router();
const Contact = require('../models/contactModel'); 

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

   //validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required'
      });
    }

    //new contact entry
    const newContact = new Contact({
      name,
      email,
      subject,
      message,
      createdAt: new Date()
    });

    await newContact.save();

    res.status(201).json({ 
      success: true,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;