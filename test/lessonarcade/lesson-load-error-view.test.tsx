import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LessonLoadErrorView } from "@/components/lesson/lesson-load-error-view";
import { LessonLoadError } from "@/lib/lessonarcade/lesson-load-error";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock motion to avoid animation issues in tests
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("LessonLoadErrorView", () => {
  const mockError: LessonLoadError = {
    kind: "not_found" as const,
    message: "Test error message",
    slug: "test-slug",
  };

  it("renders the correct title for not_found kind", async () => {
    await act(async () => {
      render(<LessonLoadErrorView error={mockError} />);
    });
    expect(screen.getByText("Lesson Not Found")).toBeInTheDocument();
  });

  it("renders the correct title for schema_invalid kind", async () => {
    await act(async () => {
      render(<LessonLoadErrorView error={{ ...mockError, kind: "schema_invalid" }} />);
    });
    expect(screen.getByText("Lesson Format Issue")).toBeInTheDocument();
  });

  it("hides debug details by default in production mode", async () => {
    await act(async () => {
      render(<LessonLoadErrorView error={mockError} debug={false} />);
    });
    expect(screen.queryByText("Debug Information")).not.toBeInTheDocument();
  });

  it("shows debug details when debug prop is true", async () => {
    await act(async () => {
      render(<LessonLoadErrorView error={mockError} debug={true} />);
    });
    expect(screen.getByText("Debug Information")).toBeInTheDocument();
    expect(screen.getByText(/test-slug/)).toBeInTheDocument();
  });

  it("renders the 'Back to Demos' button with correct link", async () => {
    await act(async () => {
      render(<LessonLoadErrorView error={mockError} />);
    });
    const link = screen.getByRole("link", { name: /back to demos/i });
    expect(link).toHaveAttribute("href", "/demo");
  });
});
