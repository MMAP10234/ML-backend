import express  from "express";

const router = express.Router();

router.get('/', (req, res) => {
    res.send("This is Category Routes")
});

export default router;



