import React from "react";
import { Alert, Button, ButtonGroup, DateInput, Input, Select, SelectItem } from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { CalendarDate } from "@internationalized/date";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { FiBell, FiImage, FiMessageCircle, FiUsers } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

const registerSchema = z
  .object({
    name: z.string().nonempty("name is required").min(3, "min 3 char").max(15, "max 15 char"),
    username: z
      .string()
      .nonempty("username is required")
      .min(3, "min 3 char")
      .max(15, "max 15 char"),
    email: z.string().email("invalid email"),
    password: z
      .string()
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/,
        "Password must have at least one Uppercase, lowercase, number and symbol and must not less than 8"
      ),
    rePassword: z.string().min(1, "Please confirm your password"),
    dateOfBirth: z.coerce
      .date()
      .refine((val) => new Date().getFullYear() - val.getFullYear() >= 12, "Age must be 12 or above"),
    gender: z.enum(["male", "female"], { message: "Please select your gender" }),
  })
  .refine((data) => data.password === data.rePassword, {
    message: "password not match",
    path: ["rePassword"],
  });

const featureCards = [
  {
    title: "Real-time Chat",
    subtitle: "Instant messaging",
    icon: FiMessageCircle,
  },
  {
    title: "Share Media",
    subtitle: "Photos & videos",
    icon: FiImage,
  },
  {
    title: "Smart Alerts",
    subtitle: "Stay updated",
    icon: FiBell,
  },
  {
    title: "Communities",
    subtitle: "Find your tribe",
    icon: FiUsers,
  },
];

const platformStats = [
  { label: "Active Users", value: "2M+", icon: FiUsers },
  { label: "Posts Shared", value: "10M+", icon: FaHeart },
  { label: "Messages Sent", value: "50M+", icon: FiMessageCircle },
];

export default function Register() {
  const navigate = useNavigate();
  const [alertState, setAlertState] = React.useState({
    isVisible: false,
    color: "success",
    title: "",
    description: "",
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      rePassword: "",
      gender: "",
      dateOfBirth: null,
    },
  });

  const API_URL = "https://route-posts.routemisr.com/users/signup";

  function extractApiMessage(apiData, fallbackMessage) {
    return (
      apiData?.message ||
      apiData?.error ||
      apiData?.errors?.[0]?.msg ||
      apiData?.data?.message ||
      fallbackMessage
    );
  }

  function showAlert(color, title, description) {
    setAlertState({
      isVisible: true,
      color,
      title,
      description,
    });
  }

  const onSubmit = async (data) => {
    const date = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    const payload = {
      name: data.name,
      username: data.username,
      email: data.email,
      dateOfBirth: date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
            date.getDate()
          ).padStart(2, "0")}`
        : "",
      gender: data.gender,
      password: data.password,
      rePassword: data.rePassword,
    };

    try {
      const res = await axios.request({
        method: "post",
        url: API_URL,
        data: payload,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      const successMessage = extractApiMessage(
        res?.data,
        "Account created successfully."
      );
      showAlert("success", "Success Notification", successMessage);
      setTimeout(() => {
        navigate("/auth/login");
      }, 1200);
    } catch (error) {
      const failMessage = extractApiMessage(
        error?.response?.data,
        error?.message || "Registration failed."
      );
      showAlert("danger", "Register Failed", failMessage);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f0f2f5] px-4 py-8 sm:py-12 lg:flex lg:items-center">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="order-2 flex w-full max-w-xl flex-col text-center lg:order-1 lg:text-left">
            <h1 className="hidden text-5xl font-extrabold tracking-tight text-[#00298d] sm:text-6xl lg:block">
              Social App
            </h1>
            <p className="mt-4 hidden text-2xl font-medium leading-snug text-shadow-slate-800 lg:block">
              Connect with friends and the world around you on SocialHub App.
            </p>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#c9d5ff] bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
              <p className="text-xl font-extrabold uppercase tracking-[0.14em] text-[#00298d]">
                About My SocialHub App
              </p>
              <p className="text-lg font-bold text-slate-900">
                Join millions of users sharing moments, ideas, and building meaningful connections every day
              </p>

              <section className="feature-section">
                <h3 className="sr-only">Platform Features</h3>
                <ul className="feature-cards grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {featureCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <li
                        key={item.title}
                        className="flex items-center gap-3 rounded-xl border border-white/35 bg-white/20 px-4 py-3 backdrop-blur-sm transition-transform duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f6ff] text-[#00298d]">
                          <Icon className="text-lg" aria-hidden="true" />
                        </div>
                        <div className="card-body">
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <span className="text-xs text-slate-700">{item.subtitle}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {platformStats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <li
                        key={stat.label}
                        className="rounded-xl border border-[#c9d5ff] bg-[#f2f6ff] px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-[#00298d]">
                          <Icon className="text-base" aria-hidden="true" />
                          <span className="text-xl font-extrabold">{stat.value}</span>
                        </div>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                          {stat.label}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </div>

          <div className="order-1 flex w-full max-w-[630px] flex-col items-center justify-center gap-5 sm:gap-4 lg:order-2">
            <p className="text-3xl font-extrabold tracking-tight text-[#00298d] sm:text-3xl lg:my-4 lg:block">
              Create your SocialHub account
            </p>

            <div className="flex w-100 flex-col gap-3 rounded-2xl bg-white p-4 sm:p-6">
              <h1 className="block text-center text-4xl font-extrabold tracking-tight text-[#00298d] sm:text-6xl lg:hidden">
                Route Posts
              </h1>
              <p className="mt-2 block text-center text-xl font-medium leading-snug text-shadow-slate-800 lg:hidden">
                Connect with friends and the world around you on Route Posts.
              </p>

              <ButtonGroup className="mb-5 flex items-center justify-between rounded-2xl bg-slate-100 p-1">
                <Button
                  className="w-1/2 rounded-lg bg-slate-100 py-2 text-center text-sm font-extrabold text-slate-600 transition hover:bg-slate-300 hover:text-slate-800"
                  onPress={() => navigate("/auth/login")}
                >
                  Login
                </Button>
                <Button
                  className="w-1/2 rounded-lg bg-[#00298d] py-2 text-center text-sm font-extrabold text-white transition"
                  onPress={() => navigate("/auth/register")}
                >
                  Register
                </Button>
              </ButtonGroup>

              <h2 className="text-2xl font-extrabold text-slate-900">Create a new account</h2>
              <p className="text-sm text-slate-500">It is quick and easy.</p>
              {alertState.isVisible ? (
                <Alert
                  color={alertState.color}
                  description={alertState.description}
                  isVisible={alertState.isVisible}
                  title={alertState.title}
                  variant="faded"
                  onClose={() =>
                    setAlertState((prev) => ({ ...prev, isVisible: false }))
                  }
                />
              ) : null}

              <form
                className="w-full items-center justify-center space-y-4"
                onSubmit={handleSubmit(onSubmit)}
                onReset={() => {
                  reset();
                }}
              >
                <div className="flex max-w-md flex-col gap-4">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        labelPlacement="outside"
                        placeholder="Full Name"
                        isInvalid={!!errors.name}
                        errorMessage={errors.name?.message}
                      />
                    )}
                  />

                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        labelPlacement="outside"
                        placeholder="@Username"
                        isInvalid={!!errors.username}
                        errorMessage={errors.username?.message}
                      />
                    )}
                  />

                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        labelPlacement="outside"
                        placeholder="Email"
                        type="email"
                        isInvalid={!!errors.email}
                        errorMessage={errors.email?.message}
                      />
                    )}
                  />

                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        labelPlacement="outside"
                        placeholder="Password"
                        type="password"
                        isInvalid={!!errors.password}
                        errorMessage={errors.password?.message}
                      />
                    )}
                  />

                  <Controller
                    name="rePassword"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        labelPlacement="outside"
                        placeholder="Confirm Password"
                        type="password"
                        isInvalid={!!errors.rePassword}
                        errorMessage={errors.rePassword?.message}
                      />
                    )}
                  />

                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        aria-label="Gender"
                        labelPlacement="outside"
                        placeholder="Gender"
                        isInvalid={!!errors.gender}
                        errorMessage={errors.gender?.message}
                      >
                        <SelectItem key="male">Male</SelectItem>
                        <SelectItem key="female">Female</SelectItem>
                      </Select>
                    )}
                  />

                  <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <DateInput
                        className="max-w-sm"
                        label="Date of Birth"
                        value={field.value}
                        onChange={field.onChange}
                        placeholderValue={new CalendarDate(1995, 11, 6)}
                        isInvalid={!!errors.dateOfBirth}
                        errorMessage={errors.dateOfBirth?.message}
                      />
                    )}
                  />

                  <div className="flex flex-col gap-4">
                    <Button
                      className="w-full bg-[#00298d] py-3 font-extrabold hover:bg-[#001f6b] disabled:opacity-60"
                      color="primary"
                      type="submit"
                      isDisabled={!isValid}
                      isLoading={isSubmitting}
                    >
                      Create New Account
                    </Button>
                    <Button type="reset" variant="bordered" className="py-3 font-bold text-slate-800">
                      Reset
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
