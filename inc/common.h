/*!
 * common.h (https://github.com/SamsungDForum/NativePlayer)
 * Copyright 2016, Samsung Electronics Co., Ltd
 * Licensed under the MIT license
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author Tomasz Borkowski
 * @author Piotr Bałut
 */

#ifndef NATIVE_PLAYER_SRC_COMMON_H_
#define NATIVE_PLAYER_SRC_COMMON_H_

#include <functional>
#include <limits>
#include <memory>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#include "ppapi/cpp/url_request_info.h"

#include "nacl_player/common.h"

#include "dash/media_stream.h"

#include "logger.h"

#define LOG_STATS __LINE__, __func__, __FILE__
#define LOG_INFO(msg, ...) Logger::Info(LOG_STATS, msg, ##__VA_ARGS__)
#define LOG_ERROR(msg, ...) Logger::Error(LOG_STATS, msg, ##__VA_ARGS__)
#define LOG_DEBUG(msg, ...) Logger::Debug(LOG_STATS, msg, ##__VA_ARGS__)

constexpr double kEps = 0.0001;
constexpr Samsung::NaClPlayer::TimeTicks kSegmentMargin = 0.1;

template <typename T, class... Args>
std::unique_ptr<T> MakeUnique(Args&&... args) {
  return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

template <typename T>
std::unique_ptr<T> AdoptUnique(T* ptr) {
  return std::unique_ptr<T>(ptr);
}

enum class StreamType : int32_t {
  Video = static_cast<int32_t>(MediaStreamType::Video),
  Audio = static_cast<int32_t>(MediaStreamType::Audio),
  MaxStreamTypes = static_cast<int32_t>(MediaStreamType::MaxTypes)
};

const Samsung::NaClPlayer::TimeTicks kEndOfStream =
    std::numeric_limits<Samsung::NaClPlayer::TimeTicks>::infinity();

std::string ToHexString(uint32_t size, const uint8_t* data);

std::vector<uint8_t> Base64Decode(const std::string& text);

// From:
// https://isocpp.org/wiki/faq/pointers-to-members#macro-for-ptr-to-memfn
#define CALL_MEMBER_FN(object, ptr_to_member)  ((object).*(ptr_to_member))

template <typename MethodSignature>
struct WeakBindHelper {
  static constexpr bool has_valid_signature = false;
};

template <typename Ret, typename ClassT, typename ... Args>
struct WeakBindHelper<Ret(ClassT::*)(Args...)> {
  static constexpr bool has_valid_signature = true;

  template<typename MethodT>
  static void WeakCall(
      MethodT method, std::weak_ptr<ClassT> weak_class_ptr, Args&& ... args) {
    if (auto class_ptr = weak_class_ptr.lock()) {
      CALL_MEMBER_FN(*class_ptr, method)(std::forward<Args>(args)...);
    } else {
      LOG_ERROR("A call to a dead object, ignoring.");
    }
  }
};

// An std::bind equivalent that binds to the method of the object referenced by
// a std::weak_ptr. If object is deleted, a call made to the resulting functor
// will be ignored.
template<typename MethodT, typename ClassT, typename ... Args>
inline auto WeakBind(
    MethodT method, const std::shared_ptr<ClassT>& class_ptr, Args&& ... args)
-> decltype(std::bind(&WeakBindHelper<MethodT>::template WeakCall<MethodT>,
    method, std::weak_ptr<ClassT>(class_ptr), std::forward<Args>(args)...)) {
  static_assert(WeakBindHelper<MethodT>::has_valid_signature,
      "\"method\" is not a valid method pointer!");
  return std::bind(
      &WeakBindHelper<MethodT>::template WeakCall<MethodT>,
      method, std::weak_ptr<ClassT>(class_ptr),
      std::forward<Args>(args)...);
}

pp::URLRequestInfo GetRequestForURL(const std::string& url);

int32_t ProcessURLRequestOnSideThread(const pp::URLRequestInfo& request,
                                      std::string* out);

int32_t ProcessURLRequestOnSideThread(const pp::URLRequestInfo& request,
                                      std::vector<uint8_t>* out);

#endif  // NATIVE_PLAYER_SRC_COMMON_H_
