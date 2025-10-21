import { useState, useEffect } from "react";
import Loading from "../../components/Loading";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import Title from "../../components/admin/Title";
import UserDetailModal from "../../components/admin/UserDetailModal";
import AdvancedPagination from "../../components/Pagination";

const ListUsers = () => {
  const { axios, getToken, user } = useAppContext();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest");
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userDetail, setUserDetail] = useState(null);

  const getAllUsers = async () => {
    try {
      const searchParams = {
        sort: sortOrder,
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) {
        searchParams.search = searchTerm;
      }

      const { data } = await axios.get(`/v1/api/admin/all-users`, {
        params: searchParams,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setUsers(data.metadata.users);
        setTotalPages(data.metadata.pagination.totalPages);
        setTotalUsers(data.metadata.pagination.total);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getAllUsers();
    }
  }, [sortOrder, currentPage, searchTerm]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleView = (user) => {
    setUserDetail(user);
    setShowDetailModal(true);
  };

  return !loading ? (
    <>
      <Title text1="Danh sách" text2="Người dùng" />

      {/* Filter Controls */}
      <div className="flex items-center justify-between gap-4 mt-6 mb-4">
        <div className="flex gap-4">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
          <div className="text-sm text-gray-200 flex items-center">Tổng: {totalUsers} người dùng</div>
        </div>

        {/* Search Section */}
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button onClick={handleSearch} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 cursor-pointer">
            Tìm kiếm
          </button>

          {searchTerm && (
            <button onClick={handleClearSearch} className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm cursor-pointer">
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Search Result Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-100">
          <span>Kết quả tìm kiếm cho: "{searchTerm}"</span>
        </div>
      )}

      <div className="max-w-7xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Ảnh đại diện</th>
              <th className="p-2 font-medium">Tên người dùng</th>
              <th className="p-2 font-medium">Email</th>
              <th className="p-2 font-medium">Ngày tạo</th>
              <th className="p-2 font-medium">Cập nhật lần cuối</th>
              <th className="p-2 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {users.map((userItem) => (
              <tr key={userItem._id} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
                <td className="p-2 pl-5">
                  <img
                    src={userItem.image}
                    alt={userItem.name}
                    className="w-12 h-12 object-cover rounded-full"
                    onError={(e) => {
                      e.target.src = "/default-avatar.jpg";
                    }}
                  />
                </td>
                <td className="p-2">
                  <div className="font-medium">{userItem.name}</div>
                </td>
                <td className="p-2">
                  <div className="text-gray-300">{userItem.email}</div>
                </td>
                <td className="p-2">{formatDate(userItem.createdAt)}</td>
                <td className="p-2">{formatDate(userItem.updatedAt)}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleView(userItem)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">
                      Chi tiết
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Results Message */}
      {users.length === 0 && !loading && <div className="text-center py-8 text-gray-500">{searchTerm ? "Không tìm thấy người dùng nào." : "Chưa có người dùng nào."}</div>}

      {/* Pagination */}
      <AdvancedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Detail Modal  */}
      {showDetailModal && ( //
        <UserDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} user={userDetail} />
      )}
    </>
  ) : (
    <Loading />
  );
};

export default ListUsers;
