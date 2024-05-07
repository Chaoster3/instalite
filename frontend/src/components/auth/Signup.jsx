import axios from 'axios';
import React, { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from "../../utils/constants";

const axiosInstance = axios.create({
  withCredentials: true
})

function Signup() {
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
    email: '',
    affiliation: '',
    birthday: '',
    linked_nconst: '',
    interest_names: [],
  });

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [topTenTagsNames, setTopTenTagsNames] = useState([]);

  const navigate = useNavigate();


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSignup1 = (e) => {
    e.preventDefault();
    if (!formData.email.includes('@') && !formData.email.includes('.')) {
      alert('Invalid email');
      return;
    }
    if (formData.username === '' || formData.password === '') {
      alert('Username and password cannot be empty');
      return;
    }
    if (formData.firstName === '' || formData.lastName === '') {
      alert('First name and last name cannot be empty');
      return;
    }
    if (formData.birthday === '') {
      alert('Birthday cannot be empty');
      return;
    }
    if (formData.affiliation === '') {
      alert('Affiliation cannot be empty');
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      alert('Passwords do not match');
      return;
    }
    console.log('Sign Up clicked');
    setIsFirstPage(false);
  };

  const handleSignup2 = async (e) => {
    e.preventDefault();

    try {
      const body = new FormData();
      for (const key in formData) {
        body.append(key, formData[key]);
      }
      //body.append('profilePoto', profilePhoto);
      // const response = await axios.post(`${baseURL}/users/register`, body, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });

      const response = await axiosInstance.post(`${BACKEND_URL}/users/register`, formData);

      if (response.status === 201) {
        console.log('Sign Up successful');
        navigate('/');
      }
    } catch (error) {
      console.log('Sign Up failed');
      console.log(error);
      setFormData({
        username: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
        email: '',
        affiliation: '',
        birthday: '',
        linked_nconst: '',
        interest_names: [],
      });
    }
  };

  
  // Function to handle search input change
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  // Function to handle tag creation input change
  const handleNewTagInputChange = (e) => {
    setNewTagInput(e.target.value);
  };

  const searchTags = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const response = await axios.get(`${BACKEND_URL}/tags/searchHashTags/${searchInput}`);

      if (response.status === 200) {
        setSearchResults(response.data);
      } else {
        setErrorMessage('Error searching tags. Please try again later.');
      }
    } catch (error) {
      console.error('Error searching tags:', error);
      setErrorMessage('Error searching tags. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new tag
  const createTag = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const response = await axiosInstance.post(`${BACKEND_URL}/tags/createTag`, { name: newTagInput });

      if (response.status === 201) {
        setNewTagInput('');
        setForm(prevForm => ({
          ...prevForm,
          hashtag_names: [...prevForm.hashtag_names, response.data.name]
        }));
        // setFinalTags([...finalTags, response.data]);
      } else if (response.status === 400) {
        setErrorMessage('Tag already exists.');
      } else {
        setErrorMessage('Error creating tag. Please try again later.');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setErrorMessage('Error creating tag. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  const addSearchedTagToFinal = (tag) => {
    // Check if the tag is already in the finalTags array
    // const isTagInFinalTags = finalTags.some(finalTag => finalTag.name === tag.name);
    const isTagInForm = form.hashtag_names.includes(tag.name);
    if (!isTagInForm) {
      setForm(prevForm => ({
        ...prevForm,
        hashtag_names: [...prevForm.hashtag_names, tag.name]
      }));
    }
  };

  // Function to remove a final tag from the finalTags array
  const removeFinalTag = (tagName) => {
    // setFinalTags(finalTags.filter(tag => tag.name !== tagName));
    setForm(prevForm => ({
      ...prevForm,
      hashtag_names: prevForm.hashtag_names.filter(tag => tag !== tagName)
    }));
  };


  const inputFields = [
    { name: 'firstName', placeholder: 'First Name', type: 'text' },
    { name: 'lastName', placeholder: 'Last Name', type: 'text' },
    { name: 'email', placeholder: 'Email', type: 'email' },
    { name: 'affiliation', placeholder: 'Affiliation', type: 'text' },
    { name: 'birthday', placeholder: 'Birthday', type: 'date' },
    { name: 'username', placeholder: 'Username', type: 'text' },
    { name: 'password', placeholder: 'Password', type: 'password' },
    {
      name: 'passwordConfirm',
      placeholder: 'Confirm Password',
      type: 'password',
    },
    {
      name: 'linked_nconst',
      placeholder: 'Linked Nconst',
      type: 'text',
    },
    {
      name: "interest",
      placeholder: "Interest",
      type: "text"
    }
  ];



  return (
    <div className="h-screen w-screen flex justify-center flex-col text-gray-700 w-96 rounded-xl bg-clip-border mx-auto">
      <div className="text-center text-2xl font-bold mb-4">
        {isFirstPage
          ? 'Welcome to Myelin Oligodendrocyte Glycoprotein'
          : 'Personalize Your Profile'}
      </div>
      <div className="flex flex-col gap-4 p-6">
        {isFirstPage &&
          inputFields.map((field, index) => (
            <div key={index} className="relative h-11 w-full min-w-[200px]">
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder=" "
                className="w-full h-full px-3 py-3 font-sans text-sm font-normal transition-all bg-transparent border rounded-md peer border-blue-gray-200 border-t-transparent text-blue-gray-700 outline outline-0 placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              />
              <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
                {field.placeholder}
              </label>
            </div>
          ))}
        {!isFirstPage && (
          <>
            <div key={8} className="relative h-11 w-full min-w-[200px]">
              <input
                type="file"
                accept="image/*"
                capture="user"
                name="Profile Picture"
                onChange={(e) => {
                  setProfilePhoto(e.target.files[0]);
                }}
                placeholder=" "
                className="w-full h-full px-3 py-3 font-sans text-sm font-normal transition-all bg-transparent border rounded-md peer border-blue-gray-200 border-t-transparent text-blue-gray-700 outline outline-0 placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              />
              <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
                {'Profile Photo'}
              </label>
            </div>
            <div key={9} className="relative h-11 w-full min-w-[200px]">
              {/* <input
                type="text"
                name="Hashtags"
                value={formData["hashtags"]}
                onChange={(e) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    hashtags: e.target.value,
                  }));
                }}
                placeholder=" "
                className="w-full h-full px-3 py-3 font-sans text-sm font-normal transition-all bg-transparent border rounded-md peer border-blue-gray-200 border-t-transparent text-blue-gray-700 outline outline-0 placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              /> */}
              {/* <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
                {"Hashtags"}
              </label> */}
            </div>
            <br></br>
            <h2>Choose New Tags</h2>
            <div>
              <input
                type="text"
                placeholder="Search for tags"
                value={searchInput}
                onChange={handleSearchInputChange}
              />
              <button onClick={searchTags}>Search</button>
            </div>

            {isLoading && <div>Loading...</div>}
            {errorMessage && <div>{errorMessage}</div>}

            <div>
              {searchResults && searchResults.map((tag) => (
                <button key={tag.id} onClick={() => addSearchedTagToFinal(tag)}>
                  {tag.name}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Enter new tag"
                value={newTagInput}
                onChange={handleNewTagInputChange}
              />
              <button onClick={createTag}>Create</button>
            </div>

            {/* Render finalTags */}
            <br></br>
            <hr />
            <br></br>
            <div>
              <h2>Final Tags</h2>
              {form.hashtag_names.map((tagName) => (
                <button
                  key={tagName}
                  onClick={() => removeFinalTag(tagName)}
                >
                  {tagName}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-6 pt-0">
        <button
          onClick={isFirstPage ? handleSignup1 : handleSignup2}
          className="block w-full select-none rounded-lg bg-gradient-to-tr from-gray-900 to-gray-800 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          type="button"
        >
          {isFirstPage ? 'Next' : 'Sign Up'}
        </button>
        <p className="flex justify-center mt-6 font-sans text-sm antialiased font-light leading-normal text-inherit">
          Already have an account?{' '}
          <Link
            to="/"
            className="block ml-1 font-sans text-sm antialiased font-bold leading-normal text-blue-gray-900"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
