import express from 'express';
import { createUser,
     getAllUsers,
      getUserById,
      deleteUser,
    updateUser} from '../controller/user.controller'; 

const router = express.Router();

router.route('/users')
  .post(createUser)
  .get(getAllUsers);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

export default router;
