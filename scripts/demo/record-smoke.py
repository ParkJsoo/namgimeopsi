#!/usr/bin/env python3
"""Record 10 seconds from the dedicated demo simulator; preserve existing clips."""
import pathlib
import signal
import subprocess
import sys
import threading

UDID = "891FA725-0B92-41D6-95B0-FC03729146B4"
if len(sys.argv) != 2:
    raise SystemExit("Usage: python3 scripts/demo/record-smoke.py OUTPUT.mp4")
output = pathlib.Path(sys.argv[1])
if output.exists():
    raise SystemExit(f"Refusing to overwrite {output}")
output.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(["xcrun", "simctl", "status_bar", UDID, "override", "--time", "9:41"], check=True)
process = subprocess.Popen(
    ["xcrun", "simctl", "io", UDID, "recordVideo", "--codec=h264", str(output)],
    stderr=subprocess.PIPE, text=True,
)
started = threading.Event()
def finish_recording():
    # simctl omits unchanged frames; force a final real framebuffer update.
    subprocess.run(["xcrun", "simctl", "status_bar", UDID, "override", "--time", "9:42"], check=True)
    threading.Timer(0.5, stop).start()

def stop():
    if process.poll() is None:
        process.send_signal(signal.SIGINT)
watchdog = threading.Timer(45, stop)
watchdog.start()
timer = None
try:
    for line in process.stderr:
        print(line, end="", flush=True)
        if "Recording started" in line and not started.is_set():
            started.set()
            timer = threading.Timer(10, finish_recording)
            timer.start()
    code = process.wait(timeout=15)
finally:
    watchdog.cancel()
    if timer:
        timer.cancel()
    stop()
if not started.is_set() or code != 0 or not output.exists():
    raise SystemExit("Recording failed; inspect stderr and the output file")
duration = float(subprocess.check_output([
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", str(output),
], text=True))
if not 10 <= duration < 12:
    raise SystemExit(f"Unexpected recording duration: {duration}s")
print(f"Recorded {duration:.3f}s; normalize to 30fps for playback (see docs/13).")
