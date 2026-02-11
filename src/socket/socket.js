import {io} from 'socket.io-client'
import api from '../components/api/api';
const socket=io(api)
export default socket;