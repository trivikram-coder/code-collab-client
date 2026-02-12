import {io} from 'socket.io-client'
import { apiUrl } from '../components/api/api';


const socket=io(apiUrl)
export default socket;