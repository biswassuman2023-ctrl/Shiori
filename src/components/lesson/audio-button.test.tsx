import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AudioButton } from "@/components/lesson/audio-button";

describe("AudioButton", () => {
  it("renders nothing when there is no audio asset", () => {
    const { container } = render(<AudioButton src={null} label="Play the sound for あ" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a labelled control when a src is present", () => {
    render(<AudioButton src="https://example.test/a.mp3" label="Play the sound for あ" />);
    expect(screen.getByRole("button", { name: "Play the sound for あ" })).toBeInTheDocument();
  });

  it("plays the audio element when clicked", async () => {
    const user = userEvent.setup();
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    render(<AudioButton src="https://example.test/a.mp3" label="Play the sound for あ" />);
    await user.click(screen.getByRole("button", { name: "Play the sound for あ" }));

    expect(playSpy).toHaveBeenCalledOnce();
    playSpy.mockRestore();
  });
});
