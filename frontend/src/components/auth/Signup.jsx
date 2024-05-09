import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from "../../utils/constants";
// import { l } from 'vite/dist/node/types.d-aGj9QkWt';
import alertGradient from '@material-tailwind/react/theme/components/alert/alertGradient';
import HashTagsSelector from '../../HashTagsSelector';

const axiosInstance = axios.create({
  withCredentials: true
})

function Signup() {
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [matches, setMatches] = useState(null);
  const [topTenTagsNames, setTopTenTagsNames] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [linked_nconst, setLinked_nconst] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
    email: '',
    affiliation: '',
    birthday: '',
    profile_pic: null,
    image_link: '',
  });


  const navigate = useNavigate();

  useEffect(() => {
    const getTagsSuggestions = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/tags/findTopTenTags`);

        if (response.status === 200) {
          setTopTenTagsNames(response.data);
        } else {
        }
      } catch (error) {
        console.error('Error getting tags suggestions:', error);
      }
    };

    getTagsSuggestions();

  }, []);

  useEffect(() => {
    if (searchInput) {
      searchTags();
    } else {
      setSearchResults([]);
    }
  }, [searchInput]);

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const searchTags = async () => {
    try {
      console.log(searchInput);
      const response = await axios.get(`${BACKEND_URL}/tags/searchHashTags/${searchInput}`);
      if (response.status === 200) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Error searching tags:', error);
    }
  };

  const finalizeTag = async () => {
    setSearchInput('');
    setHashtags(prev => ([
      ...prev,searchInput
    ]));
  };

  const addSearchedTagToFinal = (tag) => {
    if (!hashtags.includes(tag.name)) {
      setHashtags(prev => ([
        ...prev, tag.name
      ]));
    }
  };
  console.log(hashtags);

  const removeFinalTag = (tagName) => {
    setForm(prev => ([
    prev.filter(tag => tag !== tagName)
    ]));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleChangeFile = (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      ['profile_pic']: e.target.files[0],
    }));
  };

  const handlePress = (name, image) => {
    setLinked_nconst(image)
    };

  const handleSignup1 = async (e) => {
    e.preventDefault();
    console.log(formData);
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
    try {
      const body = new FormData();
      for (const key in formData) {
        body.append(key, formData[key]);
      }
      const response = await axios.post(`${BACKEND_URL}/users/getClosest`, body)
      if (response.status === 200) {
        const resMatches = response.data.matches
        const modMatches = resMatches.map(match => ({
          ...match,
          image: BACKEND_URL + '/images/' + match.image
        }))
        setMatches(modMatches);
        setFormData((prevFormData) => ({
          ...prevFormData,
          ['image_link']: response.data.image_link,
        }));
        setIsFirstPage(false);
      } else if (response.status == 409) {
        alert('An account with this username already exists');
      }
    } catch (error) {
      console.log('Sign Up failed');
      console.log(error);
    }
  };

  const handleSignup2 = async (e) => {
    e.preventDefault();

    try {
      const body = {};
      for (const key in formData) {
        body[key] = formData[key];
      }
      body.interests = hashtags;
      console.log(matches);
      const trimmed = matches.map(match => match.image.slice(BACKEND_URL.length + "/images/".length, -4));
      console.log(trimmed);
      body.nconst_options = trimmed;
      body.linked_nconst = linked_nconst.slice(BACKEND_URL.length + "/images/".length, -4);

      const response = await axiosInstance.post(`${BACKEND_URL}/users/register`, body);
      if (response.status === 200) {
        console.log('Sign Up successful');

        // Log the user in
        await axiosInstance.post(`${BACKEND_URL}/users/login`, {
          username: formData.username,
          password: formData.password,
        });
        console.log('Hi')
        navigate('/');
      }
    } catch (error) {
      console.log('Sign Up failed');
      console.log(error);
    }
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
  ];

  if (isFirstPage) {
    return (
      <div className="h-screen w-screen flex justify-center flex-col text-gray-700 w-1/2 rounded-xl bg-clip-border mx-auto">
        <div className="text-center text-2xl font-bold mb-4">
          Create an Account
        </div>
        <div className="flex flex-col gap-4 p-6">
            {inputFields.map((field, index) => (
              <div key={index} className="relative h-11 w-full min-w-[200px] w- self-center">
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
          <div key={8} className="relative h-11 w-full min-w-[200px]">
            <input
              type="file"
              accept="image/*"
              capture="user"
              name="Profile Picture"
              onChange={handleChangeFile}
              placeholder=" "
              className="w-full h-full px-3 py-3 font-sans text-sm font-normal transition-all bg-transparent border rounded-md peer border-blue-gray-200 border-t-transparent text-blue-gray-700 outline outline-0 placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
            />
            <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              {'Profile Photo'}
            </label>
          </div>
          <div key={9} className="relative h-11 w-full min-w-[200px]">
          </div>
        </div>
        <div className="p-6 pt-0">
          <button
            onClick={handleSignup1}
            className="block w-full select-none rounded-lg bg-gradient-to-tr from-gray-900 to-gray-800 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
          >
            Next
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
  } else {
    return (
      <div className="h-screen w-screen flex justify-center flex-col text-gray-700 w-96 rounded-xl bg-clip-border mx-auto">
        <>
          <div key={9} className="relative h-11 w-full min-w-[200px]">
          </div>
          <h2>Tag Suggestions</h2>
          <div>
            {topTenTagsNames.map((tag) => (
              <button key={tag.id} onClick={() => addSearchedTagToFinal(tag)}>
                {tag.name}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search for tags"
              onChange={handleSearchInputChange}
              className="w-2/3 px-4 py-2 mr-2 border border-gray-300 rounded-md"
            />
            <button type="button" onClick={finalizeTag} className="px-4 py-2 text-white bg-blue-500 rounded-md">Search</button>
          </div>
          <div className="flex flex-wrap mb-4">
            {searchResults.map((tag) => (
              <button key={tag.id} type="button" onClick={() => addSearchedTagToFinal(tag)} className="border px-3 py-1 mr-2 mb-2 text-sm bg-gray-200 rounded-md hover:border-red-500">{tag.name}</button>
            ))}
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Final Tags</h2>
            <div>
              {hashtags.map((tagName) => (
                <button key={tagName} type="button" onClick={() => removeFinalTag(tagName)} className="border px-3 py-1 mr-2 mb-2 text-sm bg-gray-200 rounded-md hover:border-red-500">{tagName}</button>
              ))}
            </div>
          </div>
        </>
        <div className="text-center text-2xl font-bold mb-4">
          Choose your Actor:
        </div>
        <div className="text-center text-2xl font-bold mb-4 flex flex-wrap justify-center">
          {matches && matches.map(match => (
            <div key={match.name} onClick={() => handlePress(match.name, match.image)} className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer shadow-md mr-4 mb-4 ${linked_nconst === match.image ? 'bg-gray-300' : 'bg-white'}`}>
              <div className="text-lg font-bold mb-2">{match.name}</div>
              <img src={match.image} alt={match.name} className="h-40 w-40 rounded-lg mb-2" />
            </div>
          ))}
        </div>
        <button
          onClick={handleSignup2}
          className="block w-full select-none rounded-lg bg-gradient-to-tr from-gray-900 to-gray-800 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          type="button"
        >
          Register
        </button>
      </div>
    )
  }
};
export default Signup;
