import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UserIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import dateFormat from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import { ArrowUpIcon, ArrowDownIcon, CalendarIcon, TrendingUpIcon, ClockIcon, PieChartIcon, RefreshCwIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import isoTimeFormat from "../../lib/isoTimeFormat";

const Dashboard = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0,
    // Enhanced data
    todayBookings: 0,
    todayRevenue: 0,
    pendingPayments: 0,
    pendingPaymentAmount: 0,
    occupancyRate: 0,
    topMovies: [],
    recentBookings: [],
    showsByStatus: {
      draft: 0,
      upcoming: 0,
      showing: 0,
      showed: 0,
    },
    revenueChart: [],
    bookingChart: [],
    topCinemas: [],
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7"); // 7, 30, 90 days
  const [refreshing, setRefreshing] = useState(false);

  // Main dashboard cards
  const dashboardCards = [
    {
      title: "Tổng vé",
      value: dashboardData.totalBookings || "0",
      icon: ChartLineIcon,
      change: dashboardData.bookingsGrowth || 0,
      color: "bg-blue-500",
    },
    {
      title: "Tổng doanh thu",
      value: `${dashboardData.totalRevenue?.toLocaleString() || "0"} ${currency}`,
      icon: CircleDollarSignIcon,
      change: dashboardData.revenueGrowth || 0,
      color: "bg-green-500",
    },
    {
      title: "Tổng show",
      value: dashboardData.activeShows?.length || "0",
      icon: PlayCircleIcon,
      change: dashboardData.showsGrowth || 0,
      color: "bg-purple-500",
    },
    {
      title: "Tổng số người dùng",
      value: dashboardData.totalUser || "0",
      icon: UserIcon,
      change: dashboardData.usersGrowth || 0,
      color: "bg-orange-500",
    },
  ];

  // Today's stats cards
  const todayStats = [
    {
      title: "Tổng vé hôm nay",
      value: dashboardData.todayBookings || "0",
      icon: CalendarIcon,
      color: "bg-indigo-500",
    },
    {
      title: "Tổng doanh thu hôm nay",
      value: `${currency} ${dashboardData.todayRevenue?.toLocaleString() || "0"}`,
      icon: TrendingUpIcon,
      color: "bg-emerald-500",
    },
    {
      title: "Chờ thanh toán",
      value: dashboardData.pendingPayments || "0",
      icon: ClockIcon,
      color: "bg-amber-500",
    },
    {
      title: "Tỷ lệ lấp đầy",
      value: `${dashboardData.occupancyRate || "0"}%`,
      icon: PieChartIcon,
      color: "bg-cyan-500",
    },
  ];

  const fetchDashboardData = async (refresh = false) => {
    if (refresh) setRefreshing(true);

    try {
      const { data } = await axios.get("/v1/api/admin/dashboard", {
        params: { timeRange },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setDashboardData(data.metadata.dashboardData);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching dashboard data: ", error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, timeRange]);

  const renderChangeIndicator = (change) => {
    if (!change) return null;
    const isPositive = change > 0;
    return (
      <div className={`flex items-center text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  return !loading ? (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title text1="Admin" text2="Dashboard" />

        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3
           py-2 border bg-black border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCwIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="relative">
        <BlurCircle top="-100px" left="0px" />

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardCards.map((card, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  {renderChangeIndicator(card.change)}
                </div>
                <div className={`p-3 rounded-full ${card.color} text-white`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Stats */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Tổng quan hôm nay</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {todayStats.map((stat, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.color} text-white`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts and Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Biểu đồ doanh thu</h3>
            <div className="h-64">
              {dashboardData.revenueChart && dashboardData.revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip formatter={(value) => [`${currency} ${value.toLocaleString()}`, "Revenue"]} labelFormatter={(label) => `Date: ${label}`} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
              )}
            </div>
          </div>

          {/* Bookings Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Biểu đồ đặt vé</h3>
            <div className="h-64">
              {dashboardData.bookingChart && dashboardData.bookingChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.bookingChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip formatter={(value) => [value, "Bookings"]} labelFormatter={(label) => `Date: ${label}`} />
                    <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row - Tables and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Movies */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Movies</h3>
            <div className="space-y-4">
              {dashboardData.topMovies?.slice(0, 5).map((movie, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">{movie.title}</p>
                      <p className="text-xs text-gray-500">{movie.bookings} bookings</p>
                      <p className="text-sm font-medium text-green-600">
                        {movie.revenue?.toLocaleString()} {currency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shows by Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Shows Status</h3>
            <div className="space-y-4">
              {Object.entries(dashboardData.showsByStatus || {}).map(([status, count]) => {
                const statusConfig = {
                  draft: { label: "Draft", color: "bg-gray-500" },
                  upcoming: { label: "Upcoming", color: "bg-blue-500" },
                  showing: { label: "Showing", color: "bg-green-500" },
                  showed: { label: "Showed", color: "bg-red-500" },
                };

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${statusConfig[status]?.color || "bg-gray-400"}`}></div>
                      <span className="text-sm text-gray-700">{statusConfig[status]?.label || status}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Bookings</h3>
            <div className="space-y-4">
              {dashboardData.recentBookings?.slice(0, 5).map((booking, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">{booking.user?.name}</p>
                    <p className="text-xs text-gray-500">{booking.movie?.title}</p>
                    <p className="text-xs text-gray-400">{dateFormat(booking.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {currency} {booking.amount}
                    </p>
                    <p className={`text-xs ${booking.isPaid ? "text-green-600" : "text-red-600"}`}>{booking.isPaid ? "Paid" : "Pending"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default Dashboard;
