import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";

const CreatePosts = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    // image: "",
    content: "",
    // hashtags: "",
  });
  const [formStatus, setFormStatus] = useState("");


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
      const response = await axios.post(
        `${BACKEND_URL}/posts/createPost`,
        form,
      );
      if (response.status === 201) {
        setFormStatus("Post created successfully");
      } else {
        setFormStatus("Post creation failed");
        setForm({
          content: "",
        });
      }
      navigate('/');

    } catch (error) {
      setFormStatus("Post creation failed");
      console.error("Error creating post:", error);
      setForm({
        content: "",
      });
    }
  };

  const inputFields = [
    { name: "content", placeholder: "Content", type: "text" },
  ];

  return (
    <div className="h-screen w-screen flex justify-center flex-col text-gray-700 w-96 rounded-xl bg-clip-border mx-auto">
      <div className="text-center text-2xl font-bold mb-4">
        Create a Post
      </div>
      <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
        {inputFields.map((field, index) => (
          <div key={index} className="relative h-11 w-full min-w-[200px]">
            <input
              type={field.type}
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              className="h-full w-full px-2 py-1 border border-gray-300 rounded-md"
            />
          </div>
        ))}
        {formStatus && <p className={formStatus.includes('successful') ? 'text-green-500' : 'text-red-500'}>{formStatus}</p>}
        <button className="bg-blue-500 text-white py-2 rounded-md">
          Submit
        </button>
      </form>
    </div>
  );
}

export default CreatePosts