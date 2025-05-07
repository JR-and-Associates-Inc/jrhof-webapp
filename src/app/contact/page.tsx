export default function ContactPage() {
  return (
    <div className="w-full max-w-screen-md mx-auto my-8 px-4 py-6 bg-white/90 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
      <form
        action="https://formsubmit.co/contact@jrhof.org"
        method="POST"
        className="space-y-4"
      >
        {/* Hidden Formsubmit Fields */}
        <input type="hidden" name="_next" value="https://jrhof.org/thanks" />
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_template" value="table" />
        <input type="hidden" name="_subject" value="📬 New Contact from JRHOF.org" />
        <input
          type="hidden"
          name="_autoresponse"
          value="Thanks for reaching out to the Joe Rossi Hall of Fame. We'll be in touch soon!"
        />

        {/* Name */}
        <div>
          <label className="block mb-1 font-semibold">Name</label>
          <input
            type="text"
            name="name"
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 font-semibold">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block mb-1 font-semibold">Message</label>
          <textarea
            name="message"
            rows={5}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#0078D7] text-white py-2 rounded font-bold hover:bg-[#005fa3] transition"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}