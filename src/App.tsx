import { Action, applyMiddleware, combineReducers, createStore, Dispatch, Reducer } from 'redux'
import { Provider, useDispatch, useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import './App.css';
import thunkMidleware from 'redux-thunk'
import { createLogger } from 'redux-logger'

// Store for Books

interface Book {
  title:string,
  url:string,
  authors:string[]
}

interface RdxBookState {
  data:Book[],
  filter:string,
  loading:boolean
}

// Action for Books

const ADD_BOOK = 'ADD_BOOK'
interface AddBookAction extends Action { data: Book }
const addBook = (data:Book) => ({type:ADD_BOOK, data})


const SET_FILTER = 'SET_FILTER'
interface SetFilterAction extends Action { filter: string }
const filterAction = (filter:string) => ({type:SET_FILTER, filter})


const RECEIVE_BOOKS = 'RECEIVE_BOOKS'
interface ReceiveBooksAction extends Action { data: Book[] }
const receiveBooks = (data:Book[]) => ({type:RECEIVE_BOOKS, data})


const REQUEST_BOOKS = 'REQUEST_BOOKS'
const requestBooks = () => ({type:REQUEST_BOOKS})


const fetchBooks = () => 
  (dispatch:any) => {
    dispatch(requestBooks())
    fetch("books.json")
    .then( resp => resp.json() )
    .then( data => dispatch(receiveBooks(data)))
  }


const initialBookState: RdxBookState =
{ data: [],
  filter:"",
  loading:false
}

const reducerBooks: Reducer<RdxBookState> = (state=initialBookState, action:Action) => {
  switch (action.type) {
    case ADD_BOOK:
      const book = (action as AddBookAction).data
      return {...state, data:[...state.data, book]}

    case SET_FILTER: 
      const filter = (action as SetFilterAction).filter
      return {...state, filter}

    case REQUEST_BOOKS:
      return {...state, loading:true}

    case RECEIVE_BOOKS:
      const data = (action as ReceiveBooksAction).data
      return {...state, data, loading:false}

    default:
      return state
  }
}


// Store for user information

interface RdxUserState {
  username: string | null,
  roles:string[],
  waiting:boolean
}

const REQUEST_LOGIN = 'REQUEST_LOGIN'
const requestLogin = () => ({type:REQUEST_LOGIN})


const RECEIVE_LOGIN = 'RECEIVE_LOGIN'
interface ReceiveLoginAction extends Action { username:string, roles:string[] }
const receiveLogin = (username:string, roles:string[]) => ({type:RECEIVE_LOGIN, username, roles})


const LOGOUT = 'LOGOUT'
const logout = () => ({type:LOGOUT})


const remoteLogin = (username:string, password:string) => 
  (dispatch:Dispatch) => {
    dispatch(requestLogin())
    fetch("/login.json") // , {method:"POST", body:JSON.stringify({username,password})})
    .then( resp => resp.json() )
    .then( data => dispatch(receiveLogin(data.username,data.roles)))
  }


const initialUserState = {
  username: null,
  roles:[],
  waiting:false
}

const reducerUsers: Reducer<RdxUserState> = (state = initialUserState, action:Action) => {
  switch (action.type) {
    case REQUEST_LOGIN:
      return {...state, waiting:true }
  
    case RECEIVE_LOGIN:
      const {username,roles} = (action as ReceiveLoginAction)
      return {...state, waiting:false, username, roles}

    case LOGOUT:
      return {...state, username:null, roles:[]}

    default:
      return state
  }
}

// Custom hooks

const useInput: (initialState: string) => [JSX.Element, string, React.Dispatch<React.SetStateAction<string>>]
  =
  (initialState) => {
    const [text, setText] = useState(initialState)

    const handleChange = (e: any) => { setText(e.target.value) }

    const input = <input type="text" value={text} onChange={handleChange} />

    return [input, text, setText]
  }




// View components for users

const useUserSelector =
  (fn: (state: RdxUserState) => any) => fn(useSelector((state: RdxGlobalState) => state.users))

const useIsAdmin = () => useUserSelector((state: RdxUserState) => state.roles.includes("ROLE_ADMIN"))

const useIsRegistered = () => useUserSelector((state: RdxUserState) => state.username != null )

const UserInfo = 
  ({username}:{username:string}) => {
    const dispatch = useDispatch()

    const handleClick = () => { dispatch(logout())}

    return <p>{username} is logged in <button onClick={handleClick}>Logout</button></p>
  }

const LoginBox = () => {
    const dispatch = useDispatch()

    const [inputUsername, username, setUsername] = useInput("")
    const [inputPassword, password, setPassword] = useInput("")

    const handleSubmit = (e:any) => {
      console.log("Here")
      e.preventDefault()
      dispatch(remoteLogin(username, password))
      setUsername("")
      setPassword("")
    }

    return <form onSubmit={handleSubmit}>
      <p>Username {inputUsername}</p>
      <p>Password {inputPassword}</p>
      <input type="submit" value="Login"/>
    </form>
  }

const UserBox = () => {
  const username = useUserSelector((state: RdxUserState) => state.username )

  return <div>
        { 
          username 
          ? 
          <UserInfo username={username}/>
          : 
          <LoginBox/>
        } 
        </div>
}


const AdminArea: React.FunctionComponent<{}> = (props) => {
  const isAdmin = useIsAdmin()

  return isAdmin ? <>{props.children}</> : <></>
}

const RegisteredArea: React.FunctionComponent<{}> = (props) => {
  const isAdmin = useIsRegistered()

  return isAdmin ? <>{props.children}</> : <></>
}


// View components for books

const useBookSelector = 
  (fn: (state: RdxBookState) => any) => fn(useSelector( (state:RdxGlobalState) => state.books ))


const BookList = () => {
  const books = useBookSelector( (state:RdxBookState) => state.data )
  const filter = useBookSelector( (state:RdxBookState) => state.filter )
  const loading = useBookSelector( (state:RdxBookState) => state.loading )

  return loading ? 
  <p>Is Loading</p>
  :
  <ul>
    {
      books.filter((b:Book) => b.title.includes(filter)).map((b:Book) => <li>{b.title}</li>)
    }
  </ul>
}

const BookForm = () => {
  const dispatch = useDispatch()
  
  const [inputTitle, title, setTitle] = useInput("")
  const [inputImage, image, setImage] = useInput("")

  const handleSubmit = (e:any) => { 
    e.preventDefault(); 

    dispatch(addBook({title:title, url:image, authors:[]}))

    setTitle(""); 
    setImage("") 
  }

  return <form onSubmit={handleSubmit}>
    <p>Title: {inputTitle}</p>
    <p>Image: {inputImage}</p>
    <input type="submit" value="Add book"/>
  </form>
}

const SearchForm = () => {
  const dispatch = useDispatch()

  const [inputSearch, search] = useInput("")

  useEffect(() => { dispatch(filterAction(search)) })

  return <div>Search: {inputSearch}</div>
}

// Layout components

const Header: React.FunctionComponent<{title:string}> = (props) =>
  <div style={{padding:"10px", background:"lightblue", textAlign:"center"}}>
    <p>{props.title}</p>
    <div>
      {props.children}
    </div>
  </div>

const Container:React.FunctionComponent<{}> = (props) => 
  <div style={{margin:"10px"}}>
    {props.children}
  </div>




const PageLayout = () => 
  <div>
    <Header title={"My Personal Library"}>
      <UserBox/>
    </Header>
    <Container>
      <RegisteredArea>
        <SearchForm/>
      </RegisteredArea>
      <BookList/>
      <AdminArea>
        <BookForm/>
      </AdminArea>
    </Container>
  </div>

// Root of the application 

// Create and initialize the store

const logger = createLogger()

interface RdxGlobalState {
  users: RdxUserState,
  books: RdxBookState
}
const reducer = combineReducers({users:reducerUsers, books: reducerBooks})

const store = createStore(reducer, applyMiddleware( thunkMidleware, logger ) )

const Page = () => {
  const dispatch = useDispatch()

  useEffect(() => { dispatch(fetchBooks()) }, [])

  return <PageLayout/>
}

function App() {
  return <Provider store={store}>
            <Page/>
         </Provider>
}

export default App;
