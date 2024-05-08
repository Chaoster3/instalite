import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";

const axiosInstance = axios.create({
  withCredentials: true
});

const CreatePosts = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
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
        navigate('/');
      } else {
        setFormStatus("Post creation failed");
      }
    } catch (error) {
      setFormStatus("Post creation failed");
      console.error("Error creating post:", error);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

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
    if (!form.hashtag_names.includes(tag.name)) {
      setForm(prevForm => ({
        ...prevForm,
        hashtag_names: [...prevForm.hashtag_names, tag.name]
      }));
    }
  };

  const removeFinalTag = (tagName) => {
    setForm(prevForm => ({
      ...prevForm,
      hashtag_names: prevForm.hashtag_names.filter(tag => tag !== tagName)
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 bg-white rounded-md shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Create a Post</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Content"
            className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md"
          />
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search for tags"
              value={searchInput}
              onChange={handleSearchInputChange}
              className="w-2/3 px-4 py-2 mr-2 border border-gray-300 rounded-md"
            />
            <button type="button" onClick={searchTags} className="px-4 py-2 text-white bg-blue-500 rounded-md">Search</button>
          </div>
          {isLoading && <p className="text-center">Loading...</p>}
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          <div className="flex flex-wrap mb-4">
            {searchResults.map((tag) => (
              <button key={tag.id} type="button" onClick={() => addSearchedTagToFinal(tag)} className="px-4 py-2 mr-2 mb-2 text-sm bg-gray-200 rounded-md">{tag.name}</button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Enter new tag"
              value={newTagInput}
              onChange={handleNewTagInputChange}
              className="w-2/3 px-4 py-2 mr-2 border border-gray-300 rounded-md"
            />
            <button type="button" onClick={createTag} className="px-4 py-2 text-white bg-green-500 rounded-md">Create</button>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Final Tags</h2>
            <div>
              {form.hashtag_names.map((tagName) => (
                <button key={tagName} type="button" onClick={() => removeFinalTag(tagName)} className="px-4 py-2 mr-2 mb-2 text-sm bg-gray-200 rounded-md">{tagName}</button>
              ))}
            </div>
          </div>
          <p className={formStatus.includes('successful') ? 'text-green-500 mb-4' : 'text-red-500 mb-4'}>{formStatus}</p>
          <button type="submit" className="w-full px-4 py-2 text-white bg-blue-500 rounded-md">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default CreatePosts;