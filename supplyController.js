const Supply = require('../models/supplyModel');

exports.getAllSupplies = async (req, res) => {
  try {
    console.log('Fetching all supplies...');
    const supplies = await Supply.find();
    console.log(`Fetched ${supplies.length} supplies`);
    res.status(200).json(supplies);
  } catch (error) {
    console.error('Error fetching supplies:', error);
    res.status(500).json({ error: 'Failed to fetch supplies' });
  }
};

exports.getSupplyById = async (req, res) => {
  try {
    const supply = await Supply.findById(req.params.id);
    if (!supply) {
      return res.status(404).json({ error: 'Supply not found' });
    }
    res.json(supply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supply' });
  }
};

exports.createSupply = async (req, res) => {
  try {
    console.log('Creating new supply...');
    const newSupply = new Supply(req.body);
    await newSupply.save();
    console.log('Supply created successfully');
    res.status(201).json(newSupply);
  } catch (error) {
    console.error('Error creating supply:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.updateSupply = async (req, res) => {
  try {
    const supply = await Supply.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!supply) {
      return res.status(404).json({ error: 'Supply not found' });
    }
    res.json(supply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supply' });
  }
};

exports.deleteSupply = async (req, res) => {
  try {
    const supply = await Supply.findByIdAndDelete(req.params.id);
    if (!supply) {
      return res.status(404).json({ error: 'Supply not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supply' });
  }
};
