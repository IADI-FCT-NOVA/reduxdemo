import { Action, applyMiddleware, createStore, Reducer } from 'redux'
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


// View components

const UserBox = () => <div><p>Mary is logged in</p></div>

const BookList = () => {
  const books = useSelector( (state:RdxBookState) => state.data )
  const filter = useSelector( (state:RdxBookState) => state.filter )
  const loading = useSelector( (state:RdxBookState) => state.loading )

  return loading ? 
  <p>Is Loading</p>
  :
  <ul>
    {
      books.filter(b => b.title.includes(filter)).map(b => <li>{b.title}</li>)
    }
  </ul>
}

const useInput: (initialState:string) => [JSX.Element, string, React.Dispatch<React.SetStateAction<string>>] 
  = 
  (initialState) => {
    const [text, setText] = useState(initialState)

    const handleChange = (e: any) => { setText(e.target.value) }

    const input = <input type="text" value={text} onChange={handleChange} />

    return [input, text, setText]
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
      <SearchForm/>
      <BookList/>
      <BookForm/>
    </Container>
  </div>

// Root of the application 

// Create and initialize the store

const logger = createLogger()

const store = createStore( reducerBooks, applyMiddleware( thunkMidleware, logger ) )

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
