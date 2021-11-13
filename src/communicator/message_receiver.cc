/*!
 * message_receiver.cc (https://github.com/SamsungDForum/NativePlayer)
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
 * @author Michal Murgrabia
 */

#include "communicator/message_receiver.h"

#include <algorithm>
#include <unordered_map>
#include <string>

#include "ppapi/cpp/var_array.h"
#include "ppapi/cpp/var_dictionary.h"

#include "communicator/messages.h"

using pp::Var;
using pp::VarArray;
using pp::VarDictionary;

namespace {

inline int32_t ClipToRange(int32_t value, int32_t min, int32_t max) {
  return std::max(min, std::min(value, max));
}

}  // anonymous namespace

namespace Communication {

void MessageReceiver::HandleMessage(pp::InstanceHandle /*instance*/,
                                    const Var& message_data) {
  LOG_INFO("MessageHandler - HandleMessage");
  if (!message_data.is_dictionary()) {
    LOG_ERROR("Not supported message format.");
    if (message_data.is_string())
      LOG_ERROR("Message content: %s", message_data.AsString().c_str());
    return;
  }

  VarDictionary msg(message_data);
  Var action_var = msg.Get(kKeyMessageToPlayer);
  if (!action_var.is_int()) {
    LOG_ERROR("Invalid message - 'action' should be an integer!");
    return;
  }
  LOG_INFO("Action type: %d", action_var.AsInt());
  auto action = static_cast<MessageToPlayer>(action_var.AsInt());

  switch (action) {
    case MessageToPlayer::kClosePlayer:
      ClosePlayer();
      break;
    case MessageToPlayer::kLoadMedia:
      LoadMedia(msg.Get(kKeyType),
                msg.Get(kKeyUrl),
                msg.Get(kKeySubtitle),
                msg.Get(kKeyEncoding),
                msg.Get(kDrmLicenseUrl),
                msg.Get(kDrmKeyRequestProperties));
      break;
    case MessageToPlayer::kPlay:
      LOG_INFO("MessageReceiver::Play()");
      Play();
      break;
    case MessageToPlayer::kPause:
      LOG_INFO("MessageReceiver::Pause()");
      Pause();
      break;
    case MessageToPlayer::kSeek:
      Seek(msg.Get(kKeyTime));
      break;
    case MessageToPlayer::kChangeRepresentation:
      ChangeRepresentation(msg.Get(kKeyType),
                           msg.Get(kKeyId));
      break;
    case MessageToPlayer::kChangeSubtitlesRepresentation:
      ChangeSubtitlesRepresentation(msg.Get(Var(kKeyId)));
      break;
    case MessageToPlayer::kChangeSubtitlesVisibility:
      ChangeSubtitlesVisibility();
      break;
    case MessageToPlayer::kChangeViewRect:
      ChangeViewRect(msg.Get(kKeyXCoordination),
                     msg.Get(kKeyYCoordination),
                     msg.Get(kKeyWidth),
                     msg.Get(kKeyHeight));
      break;
    case MessageToPlayer::kSetLogLevel:
      SetLogLevel(msg.Get(kKeyLogLevel));
      break;
    default:
      LOG_ERROR("Not supported action code!");
  }
}

Var MessageReceiver::HandleBlockingMessage(
    pp::InstanceHandle /*instance*/, const Var& /*message_data*/) {
  return Var();
}

void MessageReceiver::ClosePlayer() { player_controller_.reset(); }

void MessageReceiver::LoadMedia(const Var& type, const Var& url,
                                const Var& subtitle, const Var& encoding,
                                const Var& license_url,
                                const Var& key_request_properties) {
  if (!type.is_int() || !url.is_string()) {
    LOG_ERROR("Invalid message - 'url' should be a string");
    return;
  }
  PlayerProvider::PlayerType player_type = PlayerProvider::kUnknown;
  switch (static_cast<ClipTypeEnum>(type.AsInt())) {
    case ClipTypeEnum::kUrl :
      player_type = PlayerProvider::kUrl;
      break;
    case ClipTypeEnum::kDash:
      player_type = PlayerProvider::kEsDash;
      break;
    default:
      LOG_ERROR("Not known type of player %d", type.AsInt());
      return;
  }

  std::unordered_map<std::string, std::string> key_request_map;
  if (key_request_properties.is_dictionary()) {
    VarDictionary dict{key_request_properties};
    VarArray properties_array = dict.GetKeys();
    for (uint32_t i = 0; i < properties_array.GetLength(); ++i) {
      Var key = properties_array.Get(i);
      Var val = dict.Get(key);
      if (!val.is_string())
        continue;

      key_request_map[key.AsString()] = val.AsString();
    }
  }

  player_controller_ = player_provider_->CreatePlayer(
      player_type, url.AsString(), view_rect_,
      subtitle.is_string() ? subtitle.AsString() : "",
      encoding.is_string() ? encoding.AsString() : "",
      license_url.is_string() ? license_url.AsString() : "",
      key_request_map);
}

void MessageReceiver::Play() {
  if (player_controller_) player_controller_->Play();
}

void MessageReceiver::Pause() {
  if (player_controller_) player_controller_->Pause();
}

void MessageReceiver::Seek(const Var& time) {
  if (!time.is_double()) {
    LOG_ERROR("Invalid message - 'time' should be a float");
    return;
  }
  player_controller_->Seek(time.AsDouble());
}

void MessageReceiver::ChangeViewRect(const Var& x_position,
    const Var& y_position, const Var& width, const Var& height) {
  if (!x_position.is_int() || !y_position.is_int() || !width.is_int() ||
      !height.is_int()) {
    LOG_ERROR("Invalid message - some params are not an int type");
    return;
  }
  view_rect_ = Samsung::NaClPlayer::Rect(
      x_position.AsInt(), y_position.AsInt(), width.AsInt(), height.AsInt());
  if (player_controller_) {
    player_controller_->SetViewRect(view_rect_);
  }
}

void MessageReceiver::ChangeRepresentation(const Var& type, const Var& id) {
  if (!type.is_int() || !id.is_int()) {
    LOG_ERROR("Invalid message - 'id' and 'type' should be integers");
    return;
  }
  if (player_controller_) {
    player_controller_->ChangeRepresentation(StreamType(type.AsInt()),
                                             id.AsInt());
  }
}

void MessageReceiver::ChangeSubtitlesRepresentation(const pp::Var& id) {
  if (!id.is_int())
    return;
  if (player_controller_)
    player_controller_->ChangeSubtitles(id.AsInt());
}

void MessageReceiver::ChangeSubtitlesVisibility() {
  if (player_controller_)
    player_controller_->ChangeSubtitleVisibility();
}

void MessageReceiver::SetLogLevel(const pp::Var& pp_level) {
  if (!pp_level.is_int())
    return;
  auto level = ClipToRange(pp_level.AsInt(),
                           static_cast<int32_t>(LogLevel::kMinLevel),
                           static_cast<int32_t>(LogLevel::kMaxLevel));

  LOG_INFO("Setting JavaScript log level to: %d.", level);

  Logger::SetJsLogLevel(static_cast<LogLevel>(level));
}

}  // namespace Communication
