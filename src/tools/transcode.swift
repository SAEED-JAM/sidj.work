// Re-encodes a screen recording as a small looping copy for the page: H.264 High, no audio,
// index at the front (fast start). macOS only (AVFoundation); the full file stays for the lightbox.
//   swiftc -O transcode.swift -o /tmp/transcode
//   /tmp/transcode in.mp4 out-sm.mp4 1280 700000      # max width, bits per second
import AVFoundation
let a = CommandLine.arguments
let src = URL(fileURLWithPath: a[1]), dst = URL(fileURLWithPath: a[2])
let maxW = Double(a[3])!, bitrate = Int(a[4])!
try? FileManager.default.removeItem(at: dst)
let asset = AVURLAsset(url: src)
let sem = DispatchSemaphore(value: 0)
Task {
  do {
    let track = try await asset.loadTracks(withMediaType: .video).first!
    let size = try await track.load(.naturalSize)
    let fps = try await track.load(.nominalFrameRate)
    let tf = try await track.load(.preferredTransform)
    let s = min(1, maxW / Double(size.width))
    var w = Int((Double(size.width) * s).rounded()), h = Int((Double(size.height) * s).rounded())
    w -= w % 2; h -= h % 2
    let reader = try AVAssetReader(asset: asset)
    let out = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
    reader.add(out)
    let writer = try AVAssetWriter(outputURL: dst, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: w, AVVideoHeightKey: h,
      AVVideoScalingModeKey: AVVideoScalingModeResizeAspect,
      AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: max(1, Int(fps.rounded())) * 3,
        AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC]])
    input.transform = tf
    input.expectsMediaDataInRealTime = false
    writer.add(input)
    reader.startReading(); writer.startWriting()
    var started = false
    while true {
      if input.isReadyForMoreMediaData {
        guard let sb = out.copyNextSampleBuffer() else { input.markAsFinished(); break }
        if !started { writer.startSession(atSourceTime: CMSampleBufferGetPresentationTimeStamp(sb)); started = true }
        input.append(sb)
      } else { usleep(2000) }
    }
    await writer.finishWriting()
    if writer.status != .completed { print("error", writer.error as Any) }
    print("\(w)x\(h) fps \(fps)")
  } catch { print("error", error) }
  sem.signal()
}
sem.wait()
