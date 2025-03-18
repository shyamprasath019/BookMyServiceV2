// File: routes/gigs.js
const router = require('express').Router();
const Gig = require('../models/Gig');
const { verifyToken, isActiveFreelancer, hasFreelancerRole } = require('../middleware/auth');

// Create a new gig (freelancers only)
router.post('/', verifyToken, isActiveFreelancer, async (req, res, next) => {
  try {
    const newGig = new Gig({
      ...req.body,
      owner: req.user.id
    });
    
    const savedGig = await newGig.save();
    res.status(201).json(savedGig);
  } catch (err) {
    next(err);
  }
});

// Get gigs created by the current freelancer
router.get('/my-gigs', verifyToken, hasFreelancerRole, async (req, res, next) => {
  try {
    const gigs = await Gig.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .exec();
    
    res.status(200).json(gigs);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    
    // Check if user is the owner
    if (gig.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own gigs' });
    }
    
    // Handle activation/deactivation request
    if (req.body.hasOwnProperty('isActive') && Object.keys(req.body).length === 1) {
      // If only updating isActive status
      const updatedGig = await Gig.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: req.body.isActive } },
        { new: true }
      );
      
      return res.status(200).json(updatedGig);
    }
    
    // Handle full update
    const updatedGig = await Gig.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.status(200).json(updatedGig);
  } catch (err) {
    next(err);
  }
});


router.patch('/:id/toggle-active', verifyToken, async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    
    // Check if user is the owner
    if (gig.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own gigs' });
    }
    
    // Toggle isActive status
    gig.isActive = !gig.isActive;
    const updatedGig = await gig.save();
    
    res.status(200).json(updatedGig);
  } catch (err) {
    next(err);
  }
});

// Get all gigs (with filtering)
router.get('/', async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    
    const query = {};
    
    // Apply filters
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    
    // Only show active gigs
    query.isActive = true;
    
    // Sort options
    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'price_low') sortOption = { price: 1 };
    else if (sort === 'price_high') sortOption = { price: -1 };
    else if (sort === 'top_rated') sortOption = { rating: -1 };
    else sortOption = { createdAt: -1 }; // Default to newest
    
    const gigs = await Gig.find(query)
      .sort(sortOption)
      .populate('owner', 'username profileImage avgRating')
      .exec();
    
    res.status(200).json(gigs);
  } catch (err) {
    next(err);
  }
});

// Get a specific gig
router.get('/:id', async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('owner', 'username profileImage bio avgRating totalReviews')
      .exec();
    
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    
    res.status(200).json(gig);
  } catch (err) {
    next(err);
  }
});

// Update a gig (owner only)
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    
    // Check if user is the owner
    if (gig.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own gigs' });
    }
    
    const updatedGig = await Gig.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.status(200).json(updatedGig);
  } catch (err) {
    next(err);
  }
});

// Delete a gig (owner only)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    
    // Check if user is the owner
    if (gig.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own gigs' });
    }
    
    await Gig.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Gig deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;