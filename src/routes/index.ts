import { Router } from "express";
import { UserRouter } from "./user/user.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
