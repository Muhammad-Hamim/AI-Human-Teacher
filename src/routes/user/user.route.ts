import { Router } from "express";
const router = Router();

router.get("/all-users", (req, res) => {
  res.send({
    name:"hamim",
    email:"hamim@gmail.com"
  })
});

export const UserRouter = router;
