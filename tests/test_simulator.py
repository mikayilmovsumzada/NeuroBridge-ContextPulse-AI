"""simulator.py server ünvanını necə seçir (real şəbəkə sorğusu göndərilmir)."""
import socket
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import simulator  # noqa: E402


def test_simulator_url_env_wins(monkeypatch):
    monkeypatch.setenv("SIMULATOR_URL", "http://example.test:9000/")
    monkeypatch.setattr(simulator, "_listening", lambda url, timeout=0.3: pytest.fail("probe not expected"))
    assert simulator.default_url() == "http://example.test:9000"


def test_simulator_finds_server_on_8001(monkeypatch):
    monkeypatch.setenv("SIMULATOR_URL", "")
    monkeypatch.setattr(simulator, "_env", lambda name: "")
    monkeypatch.setattr(simulator, "_listening", lambda url, timeout=0.3: url.endswith(":8001"))
    assert simulator.default_url() == "http://localhost:8001"


def test_simulator_prefers_8000_and_falls_back_to_it(monkeypatch):
    monkeypatch.setattr(simulator, "_env", lambda name: "")
    monkeypatch.setattr(simulator, "_listening", lambda url, timeout=0.3: True)
    assert simulator.default_url() == "http://localhost:8000"
    monkeypatch.setattr(simulator, "_listening", lambda url, timeout=0.3: False)
    assert simulator.default_url() == "http://localhost:8000"


def test_listening_detects_open_and_closed_ports():
    srv = socket.socket()
    srv.bind(("127.0.0.1", 0))
    srv.listen(1)
    port = srv.getsockname()[1]
    try:
        assert simulator._listening(f"http://127.0.0.1:{port}")
    finally:
        srv.close()
    assert not simulator._listening(f"http://127.0.0.1:{port}")


def test_simulator_exits_cleanly_when_no_server(monkeypatch, capsys):
    monkeypatch.setattr(simulator, "_listening", lambda url, timeout=0.3: False)
    monkeypatch.setattr(sys, "argv", ["simulator.py", "warm", "--url", "http://localhost:1"])
    with pytest.raises(SystemExit) as e:
        simulator.main()
    assert e.value.code == 1
    assert "Server tapılmadı" in capsys.readouterr().out
