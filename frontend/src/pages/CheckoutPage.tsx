import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  Lock,
  CheckCircle2,
  Heart,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CountryCodeSelector } from "../components/CountryCodeSelector";

import { PopupDialog } from "../components/PopupDialog";

import { formatINR } from "../utils/currency";
import { API_BASE_URL } from "../services/apiBase";

export function CheckoutPage() {
  const navigate = useNavigate();
  const base = API_BASE_URL;
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Form State
  const [bookingData, setBookingData] = useState({
    hairstyle: "",
    serviceName: "",
    stylist: "",
    booking_date: "",
    booking_time: "",
    customer_name: "",
    customer_email: "",
    country_code: "+91",
    mobile: "",
    notes: "",
    payment_method: "credit_card",
    total_price: 0,
    booking_type: "salon",
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    service_charge: 0,
  });

  const [salonData, setSalonData] = useState<any>(null);

  const [salonServices, setSalonServices] = useState<any[]>([]);
  const [selectedServicesArr, setSelectedServicesArr] = useState<any[]>([]);
  const [popup, setPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const filteredTeamMembers = useMemo(() => {
    if (selectedServicesArr.length === 0 && !bookingData.hairstyle) return teamMembers;
    
    const requiredServiceIds = selectedServicesArr.length > 0 
      ? selectedServicesArr.map((s) => s.id) 
      : [bookingData.hairstyle];

    return teamMembers.filter((member) => {
      if (
        !Array.isArray(member.service_ids) ||
        member.service_ids.length === 0
      ) {
        return true;
      }
      return requiredServiceIds.every((id) => member.service_ids.includes(id));
    });
  }, [teamMembers, bookingData.hairstyle, selectedServicesArr]);

  // Pre-fill user data and selections from sessionStorage
  useEffect(() => {
    const getSalonIdFromStorage = () => {
      try {
        const raw = sessionStorage.getItem("selectedSalon");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        setSalonData(parsed);
        return parsed?.id || parsed?.salon_id || parsed?.salonId || null;
      } catch (e) {
        console.error("Failed to parse selectedSalon", e);
        return null;
      }
    };

    const isVerified = sessionStorage.getItem("isVerified") === "true";
    if (isVerified) {
      setBookingData((prev) => ({
        ...prev,
        customer_name: sessionStorage.getItem("userName") || "",
        customer_email: sessionStorage.getItem("userEmail") || "",
      }));
    }

    // Load available salon services from details page if present
    const savedServicesList = sessionStorage.getItem("selectedSalonServices");
    if (savedServicesList) {
      try {
        const list = JSON.parse(savedServicesList);
        if (list && list.length > 0) {
          const formatted = list.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: Number(item.discounted_price ?? item.price),
            originalPrice: Number(item.original_price ?? item.price),
            homeServiceAvailable: item.home_service_available ?? item.homeServiceAvailable ?? false,
            homeServicePrice: Number(item.home_service_price ?? item.discounted_price ?? item.price),
            duration:
              typeof item.duration === "number"
                ? `${item.duration} mins`
                : item.duration || "60 mins",
            image:
              item.image_url ||
              item.image ||
              "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=200&auto=format&fit=crop",
          }));
          setSalonServices(formatted);
        }
      } catch (e) {
        console.error("Failed to parse selectedSalonServices", e);
      }
    }

    const fetchSalonServices = async () => {
      try {
        const salonId = getSalonIdFromStorage();
        if (!salonId) return;

        const res = await fetch(`${base}/services?salon_id=${salonId}`);
        if (!res.ok) {
          throw new Error(`Failed services API: ${res.status}`);
        }

        const data = await res.json();
        const serviceRows = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.services)
            ? data.services
            : [];

        if (data.success && serviceRows.length > 0) {
          const formatted = serviceRows.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: Number(item.discounted_price ?? item.price),
            originalPrice: Number(item.original_price ?? item.price),
            homeServiceAvailable: item.home_service_available ?? item.homeServiceAvailable ?? false,
            homeServicePrice: Number(item.home_service_price ?? item.discounted_price ?? item.price),
            duration:
              typeof item.duration === "number"
                ? `${item.duration} mins`
                : item.duration || "60 mins",
            image:
              item.image_url ||
              item.image ||
              "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=200&auto=format&fit=crop",
          }));

          setSalonServices(formatted);
        } else {
          setSalonServices([]);
        }
      } catch (err) {
        console.error("Failed to fetch salon services", err);
      }
    };

    fetchSalonServices();

    // Preselect the selected services from details page if present
    const savedSelected = sessionStorage.getItem("selectedServices");
    if (savedSelected) {
      try {
        const list = JSON.parse(savedSelected);
        if (list && list.length > 0) {
          const formattedList = list.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: Number(item.discounted_price ?? item.price),
            originalPrice: Number(item.original_price ?? item.price),
            homeServiceAvailable: item.home_service_available ?? item.homeServiceAvailable ?? false,
            homeServicePrice: Number(item.home_service_price ?? item.discounted_price ?? item.price),
            duration: typeof item.duration === "number" ? `${item.duration} mins` : item.duration || "60 mins",
            image: item.image_url || item.image || "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=200&auto=format&fit=crop",
          }));

          setSelectedServicesArr(formattedList);
          const total = formattedList.reduce((sum: number, s: any) => sum + Number(s.price), 0);
          const serviceNames = formattedList.map((s: any) => s.name).join(", ");
          const serviceIds = formattedList.map((s: any) => s.id).join(",");
          
          setBookingData((prev) => ({
            ...prev,
            hairstyle: serviceIds,
            serviceName: serviceNames,
            total_price: total,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Fetch team members from backend for the selected salon
    const fetchTeam = async () => {
      try {
        let salonIdQuery = "";
        const salonId = getSalonIdFromStorage();
        if (salonId) salonIdQuery = `?salon_id=${salonId}`;

        const res = await fetch(`${base}/team${salonIdQuery}`);
        if (!res.ok) {
          throw new Error(`Failed team API: ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          setTeamMembers(data.data || []);
        } else {
          setTeamMembers([]);
        }
      } catch (e) {
        console.error("Failed to fetch team members", e);
      }
    };
    fetchTeam();
  }, [base]);

  useEffect(() => {
    if (
      bookingData.stylist &&
      !filteredTeamMembers.some((member) => member.name === bookingData.stylist)
    ) {
      setBookingData((prev) => ({ ...prev, stylist: "", booking_time: "" }));
      setAvailableSlots([]);
    }
  }, [filteredTeamMembers, bookingData.stylist]);

  // Fetch Slots when date and stylist are selected
  useEffect(() => {
    if (bookingData.booking_date && bookingData.stylist) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const res = await fetch(
            `${base}/bookings/slots?date=${bookingData.booking_date}&stylist=${bookingData.stylist}`,
          );
          const data = await res.json();
          if (data.success) {
            setAvailableSlots(data.availableSlots);
          }
        } catch (error) {
          console.error("Failed to fetch slots", error);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [bookingData.booking_date, bookingData.stylist]);

  const handleUpdate = (field: string, value: any) => {
    setBookingData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "booking_type") {
        const total = selectedServicesArr.reduce((sum: number, s: any) => {
          return sum + (value === "home" ? Number(s.homeServicePrice ?? s.price) : Number(s.price));
        }, 0);
        updated.total_price = total;
      }
      return updated;
    });
  };

  const handleSelectHairstyle = (hs: any) => {
    handleUpdate("hairstyle", hs.id);
    handleUpdate("serviceName", hs.name);
    
    // In case single selection is used instead of array
    setSelectedServicesArr([hs]);
    const priceToUse = bookingData.booking_type === "home" ? Number(hs.homeServicePrice ?? hs.price) : Number(hs.price);
    handleUpdate("total_price", priceToUse);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (
        !bookingData.hairstyle ||
        !bookingData.stylist ||
        !bookingData.booking_date ||
        !bookingData.booking_time
      ) {
        setPopup({
          open: true,
          title: "Complete your selection",
          message:
            "Please choose a service, stylist, date, and time before continuing.",
          tone: "warning",
        });
        return;
      }
    }
    if (step === 2) {
      if (
        !bookingData.customer_name ||
        !bookingData.customer_email ||
        !bookingData.mobile
      ) {
        setPopup({
          open: true,
          title: "Missing contact details",
          message:
            "Please fill in your name, email, and mobile number to continue.",
          tone: "warning",
        });
        return;
      }
      
      if (bookingData.booking_type === "home") {
        if (!bookingData.address || !bookingData.city || !bookingData.pincode) {
          setPopup({
            open: true,
            title: "Missing address details",
            message: "Please fill in your address, city, and pincode for home service.",
            tone: "warning",
          });
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const submitBooking = async () => {
    setIsLoading(true);
    try {
      // Base Price
      const basePrice = bookingData.total_price;
      const tax = basePrice * 0.08;
      const finalPrice = basePrice + tax;

      let salonId = undefined;
      try {
        const storedSalon = sessionStorage.getItem("selectedSalon");
        if (storedSalon) {
          salonId = JSON.parse(storedSalon).id;
        }
      } catch (e) {}

      const payload = {
        ...bookingData,
        service_name: bookingData.serviceName || bookingData.hairstyle,
        total_price: finalPrice,
        salon_id: salonId,
      };

      const res = await fetch(`${base}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        navigate(`/booking-confirmation/${data.data.id}`);
      } else {
        setPopup({
          open: true,
          title: "Booking failed",
          message:
            data.message || "Something went wrong while creating your booking.",
          tone: "error",
        });
      }
    } catch (error) {
      console.error("Booking error", error);
      setPopup({
        open: true,
        title: "Network error",
        message:
          "We could not reach the booking server right now. Please try again.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const basePriceWithCharge = bookingData.total_price;
  const tax = basePriceWithCharge * 0.08;
  const finalAmount = basePriceWithCharge + tax;

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans text-stone-800 pb-20">
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel="Understood"
        onConfirm={() => setPopup((prev) => ({ ...prev, open: false }))}
      />
      {/* Detail View Navbar */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else navigate(-1);
            }}
            className="w-10 h-10 flex items-center justify-center border border-stone-200 text-stone-500 rounded-lg hover:border-stone-400 hover:text-stone-800 transition-colors bg-white shadow-sm"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-semibold font-serif italic text-[#313131] hover:text-[#C49B89] transition-colors"
          >
            Glowup
          </button>
        </div>

        {/* Stepper indicator */}
        <div className="hidden md:flex items-center gap-3">
          <div
            className={`h-2 w-12 rounded-full ${step >= 1 ? "bg-[#CA9A86]" : "bg-stone-200"}`}
          ></div>
          <div
            className={`h-2 w-12 rounded-full ${step >= 2 ? "bg-[#CA9A86]" : "bg-stone-200"}`}
          ></div>
          <div
            className={`h-2 w-12 rounded-full ${step >= 3 ? "bg-[#CA9A86]" : "bg-stone-200"}`}
          ></div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="text-stone-600 hover:text-stone-900 transition-colors p-2">
            <Heart size={20} />
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 items-start lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
          {/* Left Content Column */}
          <div className="flex flex-col gap-10">
            {/* STEP 1: SERVICE & SLOT */}
            {step === 1 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="flex items-center gap-2 font-serif text-[1.4rem] font-medium text-[#0A2640] mb-6">
                  <Sparkles size={20} className="text-[#CA9A86]" />
                  Select Service & Time
                </h2>

                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] border border-stone-100 flex flex-col gap-8">
                  {/* Booking Type Selection */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">
                      1. Choose Booking Type
                    </h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          handleUpdate("booking_type", "salon");
                          handleUpdate("service_charge", 0);
                        }}
                        className={`flex-1 py-4 rounded-xl font-medium border-2 transition-all ${bookingData.booking_type === "salon" ? "border-[#CA9A86] bg-[#F9F4F2] text-[#CA9A86]" : "border-stone-100 bg-white text-stone-600 hover:border-stone-300"}`}
                      >
                        🏪 Salon Visit
                      </button>
                      <button
                        onClick={() => {
                          handleUpdate("booking_type", "home");
                          if (salonData?.home_service_charge) {
                            handleUpdate("service_charge", Number(salonData.home_service_charge));
                          }
                        }}
                        className={`flex-1 py-4 rounded-xl font-medium border-2 transition-all ${bookingData.booking_type === "home" ? "border-[#CA9A86] bg-[#F9F4F2] text-[#CA9A86]" : "border-stone-100 bg-white text-stone-600 hover:border-stone-300"}`}
                      >
                        🏠 Home Service
                      </button>
                    </div>
                    {bookingData.booking_type === "home" && salonData?.home_service_charge > 0 && (
                      <p className="text-xs text-stone-500 mt-2 ml-1">
                        Note: An additional Home Service charge of ₹{salonData.home_service_charge} applies.
                      </p>
                    )}
                  </div>

                  {/* Service Selection */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">
                      2. {selectedServicesArr.length > 0 ? "Selected Services" : "Choose Service"}
                    </h3>
                    
                    {selectedServicesArr.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {selectedServicesArr.map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-[#FDFBF9] p-4 rounded-xl border border-[#CA9A86] shadow-sm">
                            <div className="flex items-center gap-4">
                              <div>
                                <h4 className="font-medium text-stone-800 text-sm mb-1">{s.name}</h4>
                                <p className="text-xs text-stone-500">{s.duration || "60 mins"}</p>
                              </div>
                            </div>
                            <span className="font-semibold text-[#CA9A86]">{formatINR(bookingData.booking_type === "home" ? (s.homeServicePrice ?? s.price) : s.price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {salonServices
                          .filter(hs => bookingData.booking_type === "salon" || hs.homeServiceAvailable)
                          .map((hs) => (
                          <div
                            key={hs.id}
                            onClick={() => handleSelectHairstyle(hs)}
                            className={`relative rounded-xl border-2 cursor-pointer overflow-hidden group transition-all ${bookingData.hairstyle === hs.id ? "border-[#CA9A86]" : "border-stone-100 hover:border-stone-300"}`}
                          >
                            <div className="h-28 w-full">
                              <img
                                src={hs.image}
                                alt={hs.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="p-4 bg-white">
                              <h4 className="font-medium text-stone-800 text-sm mb-1">
                                {hs.name}
                              </h4>
                              <div className="flex justify-between items-center text-xs text-stone-500">
                                <span>{hs.duration}</span>
                                <div className="flex items-center gap-1.5">
                                  {hs.originalPrice && hs.originalPrice > hs.price && (
                                    <span className="text-[10px] text-stone-400 line-through">
                                      {formatINR(hs.originalPrice)}
                                    </span>
                                  )}
                                  <span className="font-semibold text-[#CA9A86]">
                                    {formatINR(bookingData.booking_type === "home" ? (hs.homeServicePrice ?? hs.price) : hs.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {bookingData.hairstyle === hs.id && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-[#CA9A86] text-white rounded-full flex items-center justify-center">
                                <CheckCircle2 size={14} />
                              </div>
                            )}
                          </div>
                        ))}
                        {salonServices.filter(hs => bookingData.booking_type === "home" && !hs.homeServiceAvailable).length === salonServices.length && (
                          <div className="col-span-3 text-center py-4 text-stone-500 text-sm border border-stone-200 rounded-xl bg-stone-50">
                            No services available for Home Visit at this salon.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stylist Selection */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">
                      3. Select Stylist
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredTeamMembers.length > 0 ? (
                        filteredTeamMembers.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => handleUpdate("stylist", st.name)}
                            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all ${bookingData.stylist === st.name ? "border-[#CA9A86] bg-[#F9F4F2]" : "border-stone-100 bg-white hover:border-stone-200"}`}
                          >
                            <div className="w-14 h-14 rounded-full bg-stone-200 overflow-hidden flex items-center justify-center">
                              {st.image_url ? (
                                <img
                                  src={st.image_url}
                                  alt={st.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={`https://ui-avatars.com/api/?name=${st.name}&background=DEB5A4&color=fff`}
                                  alt={st.name}
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-stone-800 text-sm">
                                {st.name}
                              </p>
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                {st.role}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-stone-500 px-2">
                          {bookingData.hairstyle
                            ? "No stylists available for selected service."
                            : "No team members available for this salon."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">
                      4. Select Date
                    </h3>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingData.booking_date}
                      onChange={(e) =>
                        handleUpdate("booking_date", e.target.value)
                      }
                      className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700 w-full md:w-1/2"
                    />
                  </div>

                  {/* Time Selection */}
                  {bookingData.booking_date && bookingData.stylist && (
                    <div className="animate-in fade-in">
                      <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        5. Available Slots
                        {loadingSlots && (
                          <Loader2
                            size={14}
                            className="animate-spin text-[#CA9A86]"
                          />
                        )}
                      </h3>
                      {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => handleUpdate("booking_time", slot)}
                              className={`py-3 rounded-lg text-sm font-medium border-2 transition-colors ${bookingData.booking_time === slot ? "border-[#CA9A86] bg-[#CA9A86] text-white" : "border-stone-100 bg-white text-stone-600 hover:border-stone-300"}`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : (
                        !loadingSlots && (
                          <p className="text-red-500 text-sm">
                            No slots available for this date and stylist.
                          </p>
                        )
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleNextStep}
                    className="w-full mt-4 bg-[#CA9A86] hover:bg-[#B38775] text-white px-6 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Continue to Details
                  </button>
                </div>
              </section>
            )}

            {/* STEP 2: CONTACT DETAILS */}
            {step === 2 && (
              <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="flex items-center gap-2 font-serif text-[1.4rem] font-medium text-[#0A2640] mb-6">
                  <User size={20} className="text-[#CA9A86]" />
                  Contact Details
                </h2>

                <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] border border-stone-100 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-stone-600">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Julianne Moore"
                        value={bookingData.customer_name}
                        onChange={(e) =>
                          handleUpdate("customer_name", e.target.value)
                        }
                        className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-stone-600">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="j.moore@atelier.com"
                        value={bookingData.customer_email}
                        onChange={(e) =>
                          handleUpdate("customer_email", e.target.value)
                        }
                        className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-600">
                      Phone Number
                    </label>
                    <div className="flex">
                      <CountryCodeSelector
                        selectedCountry={bookingData.country_code}
                        onChange={(code) => handleUpdate("country_code", code)}
                      />
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={bookingData.mobile}
                        onChange={(e) => handleUpdate("mobile", e.target.value)}
                        className="flex-1 bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-r-xl px-5 py-3.5 outline-none transition-all text-stone-700"
                      />
                    </div>
                  </div>

                  {bookingData.booking_type === "home" && (
                    <div className="animate-in fade-in flex flex-col gap-6 pt-4 border-t border-stone-100 mt-2">
                      <h3 className="font-serif text-lg text-stone-800 flex items-center gap-2">
                        🏠 Service Address
                      </h3>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-stone-600">
                          Full Address
                        </label>
                        <input
                          type="text"
                          placeholder="House No, Building, Street"
                          value={bookingData.address}
                          onChange={(e) => handleUpdate("address", e.target.value)}
                          className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-stone-600">
                            Landmark (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Near..."
                            value={bookingData.landmark}
                            onChange={(e) => handleUpdate("landmark", e.target.value)}
                            className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-stone-600">
                            City
                          </label>
                          <input
                            type="text"
                            placeholder="City"
                            value={bookingData.city}
                            onChange={(e) => handleUpdate("city", e.target.value)}
                            className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-stone-600">
                          Pincode
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 110001"
                          value={bookingData.pincode}
                          onChange={(e) => handleUpdate("pincode", e.target.value)}
                          className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700 w-full md:w-1/2"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-600">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      placeholder="Any allergies, requests, etc."
                      value={bookingData.notes}
                      onChange={(e) => handleUpdate("notes", e.target.value)}
                      className="min-h-25 rounded-xl border-transparent bg-[#F6F5F2] px-5 py-3.5 text-stone-700 outline-none transition-all focus:border-[#C49B89] focus:bg-white focus:ring-1 focus:ring-[#C49B89] resize-none"
                    />
                  </div>

                  <button
                    onClick={handleNextStep}
                    className="w-full mt-4 bg-[#CA9A86] hover:bg-[#B38775] text-white px-6 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Continue to Payment
                  </button>
                </div>
              </section>
            )}

            {/* STEP 3: PAYMENT */}
            {step === 3 && (
              <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="flex items-center gap-2 font-serif text-[1.4rem] font-medium text-[#0A2640] mb-6">
                  <CreditCard size={20} className="text-[#CA9A86]" />
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
                  <button
                    onClick={() =>
                      handleUpdate("payment_method", "credit_card")
                    }
                    className={`flex flex-col items-center justify-center gap-2 px-6 py-5 rounded-xl font-medium transition-all ${bookingData.payment_method === "credit_card" ? "bg-[#F9F4F2] border-2 border-[#DEB5A4] text-stone-800" : "bg-white border-2 border-stone-100 text-stone-500 hover:border-stone-300"}`}
                  >
                    <CreditCard
                      size={24}
                      className={
                        bookingData.payment_method === "credit_card"
                          ? "text-[#CA9A86]"
                          : ""
                      }
                    />
                    <span>Credit Card</span>
                  </button>
                  <button
                    onClick={() => handleUpdate("payment_method", "upi")}
                    className={`flex flex-col items-center justify-center gap-2 px-6 py-5 rounded-xl font-medium transition-all ${bookingData.payment_method === "upi" ? "bg-[#F9F4F2] border-2 border-[#DEB5A4] text-stone-800" : "bg-white border-2 border-stone-100 text-stone-500 hover:border-stone-300"}`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={
                        bookingData.payment_method === "upi"
                          ? "text-[#CA9A86]"
                          : ""
                      }
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                    <span>UPI</span>
                  </button>
                  <button
                    onClick={() => handleUpdate("payment_method", "wallet")}
                    className={`flex flex-col items-center justify-center gap-2 px-6 py-5 rounded-xl font-medium transition-all ${bookingData.payment_method === "wallet" ? "bg-[#F9F4F2] border-2 border-[#DEB5A4] text-stone-800" : "bg-white border-2 border-stone-100 text-stone-500 hover:border-stone-300"}`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={
                        bookingData.payment_method === "wallet"
                          ? "text-[#CA9A86]"
                          : ""
                      }
                    >
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                    <span>Wallet</span>
                  </button>
                  <button
                    onClick={() => handleUpdate("payment_method", "cash")}
                    className={`flex flex-col items-center justify-center gap-2 px-6 py-5 rounded-xl font-medium transition-all ${bookingData.payment_method === "cash" ? "bg-[#F9F4F2] border-2 border-[#DEB5A4] text-stone-800" : "bg-white border-2 border-stone-100 text-stone-500 hover:border-stone-300"}`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={
                        bookingData.payment_method === "cash"
                          ? "text-[#CA9A86]"
                          : ""
                      }
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8" />
                      <path d="M8 12h8" />
                    </svg>
                    <span>Cash at Salon</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] border border-stone-100 flex flex-col gap-6 sm:p-8">
                  {bookingData.payment_method === "credit_card" && (
                    <div className="animate-in fade-in flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-stone-600">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="**** **** **** 4421"
                            className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl pl-5 pr-12 py-3.5 outline-none transition-all text-stone-700 w-full font-mono tracking-wider"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-stone-600">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM / YY"
                            className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700 font-mono tracking-widest uppercase"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-stone-600">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="***"
                            className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700 font-mono tracking-widest"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {bookingData.payment_method === "upi" && (
                    <div className="animate-in fade-in flex flex-col gap-2">
                      <label className="text-sm font-medium text-stone-600">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        placeholder="username@upi"
                        className="bg-[#F6F5F2] border-transparent focus:border-[#C49B89] focus:ring-1 focus:ring-[#C49B89] focus:bg-white rounded-xl px-5 py-3.5 outline-none transition-all text-stone-700 w-full"
                      />
                    </div>
                  )}

                  {bookingData.payment_method === "wallet" && (
                    <div className="animate-in fade-in flex flex-col gap-2">
                      <p className="text-stone-500 text-sm">
                        You will be redirected to your wallet provider to
                        complete the payment.
                      </p>
                    </div>
                  )}

                  {bookingData.payment_method === "cash" && (
                    <div className="animate-in fade-in flex flex-col gap-2">
                      <p className="text-stone-500 text-sm">
                        You have chosen to pay at the salon. Please note that
                        cancellations within 2 hours of the appointment may
                        incur a fee.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Summary Sticky Panel */}
          <div className="bg-white border border-stone-100 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.05)] rounded-4xl overflow-hidden lg:sticky lg:top-8">
            <div className="w-full h-32 relative">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2874&auto=format&fit=crop"
                className="w-full h-full object-cover"
                alt="Salon header"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-4 left-5 text-white">
                <h3 className="font-serif text-xl font-medium mb-1">
                  The Aurelia Atelier
                </h3>
                <div className="text-white/80 text-xs flex items-center gap-1.5">
                  Beverly Hills, CA
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-6 sm:p-7">
              {/* Specifics */}
              {bookingData.serviceName ? (
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-[11px] font-bold text-stone-400 tracking-[0.15em] uppercase mb-1.5">
                      SERVICE
                    </h5>
                    <h4 className="text-stone-800 font-serif font-medium text-[16px] mb-1">
                      {bookingData.serviceName}
                    </h4>
                    <p className="text-stone-500 text-xs">
                      with {bookingData.stylist || "Any Stylist"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-stone-400 italic">
                  No service selected yet...
                </div>
              )}

              <div className="h-px w-full bg-stone-100"></div>

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 text-[#CA9A86] flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h5 className="text-[11px] text-stone-500 mb-0.5">
                      Date & Time
                    </h5>
                    <p className="text-[14px] text-stone-800 font-medium">
                      {bookingData.booking_date
                        ? new Date(bookingData.booking_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "Pending"}
                      {bookingData.booking_time
                        ? ` • ${bookingData.booking_time}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown container */}
              <div className="border border-stone-100 bg-[#FCFBFB] rounded-3xl p-6 mt-2 flex flex-col gap-3">
                <div className="flex justify-between items-center text-[13px] text-stone-500">
                  <span>Base Price</span>
                  <span>{formatINR(bookingData.total_price)}</span>
                </div>

                <div className="flex justify-between items-center text-[13px] text-stone-500">
                  <span>Taxes (8%)</span>
                  <span>{formatINR(tax)}</span>
                </div>
                <div className="flex justify-between items-center text-[18px] font-medium text-stone-800 border-t border-stone-200 border-dashed pt-3 mt-1">
                  <span>Final Amount</span>
                  <span>{formatINR(finalAmount)}</span>
                </div>
              </div>

              {step === 3 && (
                <div className="flex flex-col items-center gap-4 mt-2">
                  <button
                    onClick={submitBooking}
                    disabled={isLoading}
                    className="w-full bg-[#CA9A86] hover:bg-[#B38775] text-white px-6 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Lock size={16} /> Confirm & Book
                      </>
                    )}
                  </button>
                  <p className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium tracking-wide">
                    <CheckCircle2 size={12} /> Secure 256-bit encrypted booking
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
