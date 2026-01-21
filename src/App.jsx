import { BrowserRouter,Routes,Route } from "react-router-dom"
import RoomJoin from "./Components/RoomJoin"

import EditorComp from "./Components/EditorComp"
import ChatComp from "./Components/ChatComp"
import EditorMain from "./Components/EditorMain"
const App = () => {
  
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<RoomJoin/>}/>
     
      <Route path="/chat/:roomId" element={<ChatComp/>}/>
      <Route path="/editor/:roomId" element={<EditorMain/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App
