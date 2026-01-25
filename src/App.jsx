import { BrowserRouter,Routes,Route } from "react-router-dom"


import ChatComp from "./components/ChatComp"
import EditorMain from "./components/EditorMain"
import Dashboard from "./components/Dashboard"

const App = () => {
  
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Dashboard/>}/>
     
      <Route path="/chat/:roomId" element={<ChatComp/>}/>
      <Route path="/editor/:roomId" element={<EditorMain/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App
