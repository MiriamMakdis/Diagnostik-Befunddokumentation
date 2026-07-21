const express = require('express');
const router = express.Router();

router.get('/',(req,res)=>{
    res.send("Hello")    
})

router.post('/:processId/radiology-orders', async (req, res, next) => { 
  try { 
    const result = await createRadiologyOrder({ 
        processId: req.params.processId, 
        input: req.body, 
        user: req.user 
    }); 
    res.status(201).json(result); 
  } catch (error) { 
    next(error); 
  } 
});

module.exports = router;