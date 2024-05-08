import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";

const axiosInstance = axios.create({
  withCredentials: true
})

const CreatePosts = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    // image: "",
    content: "",
    hashtag_names: [],
  });
  const [formStatus, setFormStatus] = useState("");

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}/posts/createPost`,
        form
      );
      if (response.status === 201) {
        setFormStatus("Post created successfully");
      } else {
        setFormStatus("Post creation failed");
        setForm({
          content: "",
          hashtags: [],
        });
      }
      navigate('/');

    } catch (error) {
      setFormStatus("Post creation failed");
      console.error("Error creating post:", error);
      setForm({
        content: "",
        hashtags: [],
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
    { name: "content", placeholder: "Content", type: "text" },
  ];

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="text-center text-2xl font-bold mb-4">
          Create a Post
        </div>
        <div className="space-y-4">
          {inputFields.map((field, index) => (
            <div key={index}>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <hr />
          <div>
            <h2 className="text-lg font-semibold mb-2">Choose New Tags</h2>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search for tags"
                value={searchInput}
                onChange={handleSearchInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <button onClick={searchTags} className="bg-blue-500 text-white px-4 py-2 rounded-md">Search</button>
            </div>
            {isLoading && <div>Loading...</div>}
            {errorMessage && <div className="text-red-500">{errorMessage}</div>}
            <div className="flex flex-wrap mt-2">
              {searchResults && searchResults.map((tag) => (
                <button key={tag.id} onClick={() => addSearchedTagToFinal(tag)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md mr-2 mb-2">{tag.name}</button>
              ))}
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="text"
                placeholder="Enter new tag"
                value={newTagInput}
                onChange={handleNewTagInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <button onClick={createTag} className="bg-blue-500 text-white px-4 py-2 rounded-md">Create</button>
            </div>
          </div>
          <hr />
          <div>
            <h2 className="text-lg font-semibold mb-2">Final Tags</h2>
            <div className="flex flex-wrap">
              {form.hashtag_names.map((tagName, index) => (
                <button key={index} onClick={() => removeFinalTag(tagName)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md mr-2 mb-2">{tagName}</button>
              ))}
            </div>
            {formStatus && <p className={formStatus.includes('successful') ? 'text-green-500' : 'text-red-500'}>{formStatus}</p>}
            <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4">Submit</button>
          </div>
        </div>
      </div>
    </div>
  );

}
export default CreatePosts