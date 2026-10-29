
import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '')

const FOODS_URL = `${API_BASE_URL}/foods`

const EMPTY_FORM = {
  foodId: '',
  name: '',
  category: '',
  cuisine: '',
  ingredients: '',
  price: '',
  quantity: '',
  description: '',
  imageUrl: '',
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString('vi-VN') + ' ₫'
}

function getErrorMessage(result, fallback) {
  return result?.message || result?.error || fallback
}

function App() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const [selectedFood, setSelectedFood] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Tải danh sách món ăn từ Backend.
  async function fetchFoods(keyword = activeSearch) {
    try {
      setLoading(true)
      setError('')

      const url = keyword.trim()
        ? `${FOODS_URL}?search=${encodeURIComponent(keyword.trim())}`
        : FOODS_URL

      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, 'Không thể tải danh sách món ăn.')
        )
      }

      const list = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : []

      setFoods(list)
    } catch (err) {
      console.error('Lỗi tải danh sách:', err)
      setError(
        err.message === 'Failed to fetch'
          ? 'Không thể kết nối Backend. Hãy kiểm tra máy chủ API và cấu hình CORS.'
          : err.message || 'Không thể tải danh sách món ăn.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Tải dữ liệu ban đầu mà không gọi fetchFoods trực tiếp trong effect.
  useEffect(() => {
    let cancelled = false

    async function loadInitialFoods() {
      try {
        const response = await fetch(FOODS_URL)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            getErrorMessage(result, 'Không thể tải danh sách món ăn.')
          )
        }

        const list = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : []

        if (!cancelled) {
          setFoods(list)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Lỗi tải danh sách:', err)
          setError(
            err.message === 'Failed to fetch'
              ? 'Không thể kết nối Backend. Hãy kiểm tra máy chủ API và cấu hình CORS.'
              : err.message || 'Không thể tải danh sách món ăn.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitialFoods()

    return () => {
      cancelled = true
    }
  }, [])

  // Tìm kiếm món ăn.
  function handleSearch(event) {
    event.preventDefault()
    const keyword = search.trim()
    setActiveSearch(keyword)
    fetchFoods(keyword)
  }

  // Tải lại danh sách.
  function handleRefresh() {
    setSearch('')
    setActiveSearch('')
    setNotice('')
    fetchFoods('')
  }

  // Mở biểu mẫu thêm món ăn.
  function openCreateForm() {
    setEditingFood(null)
    setForm({ ...EMPTY_FORM })
    setFormOpen(true)
    setSelectedFood(null)
    setError('')
    setNotice('')
  }

  // Mở biểu mẫu chỉnh sửa.
  function openEditForm(food) {
    setEditingFood(food)
    setForm({
      foodId: food.foodId || '',
      name: food.name || '',
      category: food.category || '',
      cuisine: food.cuisine || '',
      ingredients: Array.isArray(food.ingredients)
        ? food.ingredients.join(', ')
        : '',
      price: food.price ?? '',
      quantity: food.quantity ?? '',
      description: food.description || '',
      imageUrl: food.imageUrl || '',
    })

    setFormOpen(true)
    setSelectedFood(null)
    setError('')
    setNotice('')
  }

  function closeForm() {
    if (saving) return
    setFormOpen(false)
    setEditingFood(null)
    setForm({ ...EMPTY_FORM })
  }

  function handleInputChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Thêm mới hoặc cập nhật món ăn.
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    const price = Number(form.price)
    const quantity = Number(form.quantity)

    if (
      !form.foodId.trim() ||
      !form.name.trim() ||
      !form.category.trim() ||
      !form.cuisine.trim()
    ) {
      setError('Vui lòng nhập mã món, tên món, loại món và ẩm thực.')
      return
    }

    if (form.price === '' || !Number.isFinite(price) || price < 0) {
      setError('Giá bán phải là số không âm.')
      return
    }

    if (
      form.quantity === '' ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setError('Số lượng phải là số nguyên không âm.')
      return
    }

    const payload = {
      foodId: form.foodId.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      cuisine: form.cuisine.trim(),
      ingredients: form.ingredients
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      price,
      quantity,
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
    }

    try {
      setSaving(true)

      const isEditing = Boolean(editingFood)
      const id = editingFood?._id || editingFood?.foodId

      const response = await fetch(
        isEditing
          ? `${FOODS_URL}/${encodeURIComponent(id)}`
          : FOODS_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            isEditing
              ? 'Không thể cập nhật món ăn.'
              : 'Không thể thêm món ăn.'
          )
        )
      }

      setFormOpen(false)
      setEditingFood(null)
      setForm({ ...EMPTY_FORM })

      setNotice(
        isEditing
          ? 'Cập nhật món ăn thành công!'
          : 'Thêm món ăn thành công!'
      )

      await fetchFoods()
    } catch (err) {
      console.error('Lỗi lưu món ăn:', err)
      setError(err.message || 'Đã xảy ra lỗi khi lưu món ăn.')
    } finally {
      setSaving(false)
    }
  }

  // Xóa món ăn.
  async function handleDelete(food) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa món "${food.name}" không?`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const id = food._id || food.foodId

      const response = await fetch(
        `${FOODS_URL}/${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, 'Không thể xóa món ăn.')
        )
      }

      setSelectedFood(null)
      setNotice('Xóa món ăn thành công!')
      await fetchFoods()
    } catch (err) {
      console.error('Lỗi xóa món ăn:', err)
      setError(err.message || 'Đã xảy ra lỗi khi xóa món ăn.')
    }
  }

  function openDetails(food) {
    setSelectedFood(food)
    setError('')
    setNotice('')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="brand-mark">FM</div>

          <div>
            <p className="eyebrow">FOOD MANAGEMENT SYSTEM</p>
            <h1>Quản lý món ăn</h1>
            <p className="subtitle">
              Quản lý danh sách và thông tin món ăn nhà hàng
            </p>
          </div>
        </div>

        <div className="food-count">
          <span>Tổng số món ăn</span>
          <strong>{foods.length}</strong>
        </div>
      </header>

      <main className="content">
        <section className="toolbar">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Tìm theo tên, loại món hoặc ẩm thực..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Từ khóa tìm kiếm món ăn"
            />

            <button className="btn btn-primary" type="submit">
              Tìm kiếm
            </button>
          </form>

          <div className="toolbar-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleRefresh}
              disabled={loading}
            >
              Tải lại
            </button>

            <button
              className="btn btn-success"
              type="button"
              onClick={openCreateForm}
            >
              + Thêm món ăn
            </button>
          </div>
        </section>

        {notice && (
          <div className="alert alert-success" role="status">
            <span>{notice}</span>
            <button
              type="button"
              className="alert-close"
              onClick={() => setNotice('')}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="alert-close"
              onClick={() => setError('')}
              aria-label="Đóng thông báo lỗi"
            >
              ×
            </button>
          </div>
        )}

        <section className="table-card">
          <div className="table-heading">
            <div>
              <h2>Danh sách món ăn</h2>
              <p>Thông tin các món ăn hiện có trong hệ thống</p>
            </div>

            <span className="result-count">{foods.length} món</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Đang tải danh sách món ăn...</p>
            </div>
          ) : foods.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>Chưa có món ăn phù hợp</h3>
              <p>Thử từ khóa khác hoặc thêm món ăn mới.</p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateForm}
              >
                + Thêm món ăn
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Mã món</th>
                    <th>Tên món ăn</th>
                    <th>Loại món</th>
                    <th>Ẩm thực</th>
                    <th>Giá bán</th>
                    <th>Số lượng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {foods.map((food) => (
                    <tr key={food._id || food.foodId}>
                      <td className="food-code">{food.foodId}</td>

                      <td>
                        <div className="food-title">{food.name}</div>
                        {food.description && (
                          <div className="food-description">
                            {food.description}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="category">{food.category}</span>
                      </td>

                      <td>{food.cuisine}</td>

                      <td className="price">{formatPrice(food.price)}</td>

                      <td>
                        <span className="quantity">
                          {food.quantity ?? 0}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-small btn-detail"
                            onClick={() => openDetails(food)}
                          >
                            Chi tiết
                          </button>

                          <button
                            type="button"
                            className="btn btn-small btn-edit"
                            onClick={() => openEditForm(food)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="btn btn-small btn-delete"
                            onClick={() => handleDelete(food)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer">
          <span>Hệ thống quản lý món ăn</span>
          <span>React · Vite · Express · MongoDB Atlas</span>
        </footer>
      </main>

      {/* Biểu mẫu thêm hoặc cập nhật món ăn */}
      {formOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow modal-eyebrow">FOOD INFORMATION</p>
                <h2 id="form-title">
                  {editingFood ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}
                </h2>
              </div>

              <button
                className="modal-x"
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Đóng biểu mẫu"
              >
                ×
              </button>
            </div>

            <form className="food-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Mã món ăn *
                  <input
                    name="foodId"
                    value={form.foodId}
                    onChange={handleInputChange}
                    placeholder="VD: FOOD004"
                    required
                    maxLength={50}
                  />
                </label>

                <label>
                  Tên món ăn *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên món"
                    required
                    maxLength={150}
                  />
                </label>

                <label>
                  Loại món *
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    placeholder="VD: Món nước"
                    required
                  />
                </label>

                <label>
                  Ẩm thực *
                  <input
                    name="cuisine"
                    value={form.cuisine}
                    onChange={handleInputChange}
                    placeholder="VD: Việt Nam"
                    required
                  />
                </label>

                <label>
                  Giá bán (VNĐ) *
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="any"
                    value={form.price}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Số lượng *
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label className="full-width">
                  Nguyên liệu
                  <input
                    name="ingredients"
                    value={form.ingredients}
                    onChange={handleInputChange}
                    placeholder="Phân cách nguyên liệu bằng dấu phẩy"
                  />
                </label>

                <label className="full-width">
                  Đường dẫn hình ảnh
                  <input
                    name="imageUrl"
                    type="url"
                    value={form.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/food.jpg"
                  />
                </label>

                <label className="full-width">
                  Mô tả
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Mô tả món ăn..."
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Đang lưu...'
                    : editingFood
                      ? 'Lưu thay đổi'
                      : 'Thêm món ăn'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Chi tiết món ăn */}
      {selectedFood && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedFood(null)
            }
          }}
        >
          <section
            className="modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow modal-eyebrow">FOOD DETAILS</p>
                <h2 id="detail-title">Chi tiết món ăn</h2>
              </div>

              <button
                type="button"
                className="modal-x"
                onClick={() => setSelectedFood(null)}
                aria-label="Đóng chi tiết"
              >
                ×
              </button>
            </div>

            {selectedFood.imageUrl && (
              <img
                className="detail-image"
                src={selectedFood.imageUrl}
                alt={selectedFood.name}
              />
            )}

            <div className="detail-list">
              <div>
                <span>Mã món</span>
                <strong>{selectedFood.foodId || '—'}</strong>
              </div>

              <div>
                <span>Tên món</span>
                <strong>{selectedFood.name || '—'}</strong>
              </div>

              <div>
                <span>Loại món</span>
                <strong>{selectedFood.category || '—'}</strong>
              </div>

              <div>
                <span>Ẩm thực</span>
                <strong>{selectedFood.cuisine || '—'}</strong>
              </div>

              <div>
                <span>Giá bán</span>
                <strong className="price">
                  {formatPrice(selectedFood.price)}
                </strong>
              </div>

              <div>
                <span>Số lượng</span>
                <strong>{selectedFood.quantity ?? 0}</strong>
              </div>

              <div className="detail-full">
                <span>Nguyên liệu</span>
                <strong>
                  {Array.isArray(selectedFood.ingredients) &&
                  selectedFood.ingredients.length
                    ? selectedFood.ingredients.join(', ')
                    : 'Chưa có thông tin'}
                </strong>
              </div>

              <div className="detail-full">
                <span>Mô tả</span>
                <strong>
                  {selectedFood.description || 'Chưa có mô tả'}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedFood(null)}
              >
                Đóng
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openEditForm(selectedFood)}
              >
                Chỉnh sửa
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
