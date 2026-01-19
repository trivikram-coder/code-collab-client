import { BrowserRouter,Routes,Route } from "react-router-dom"
import RoomJoin from "./Components/RoomJoin"

import EditorComp from "./Components/EditorComp"
import ChatComp from "./Components/ChatComp"
const App = () => {
  
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<RoomJoin/>}/>
      <Route path="/editor/:roomId" element={<EditorComp/>}/>
      <Route path="/chat/:roomId" element={<ChatComp/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App
