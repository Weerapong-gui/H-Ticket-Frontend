"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  confirmDemoState,
  DemoBooking,
  DemoState,
  initialDemoState,
  needsRemovalConfirmation,
  resizeStudents,
  StudentInfo,
  validQuantity,
} from "@/lib/demo-booking";
type DemoContext = {
  revision: number;
  quantity: number;
  setQuantity: (value: number) => void;
  students: StudentInfo[];
  updateStudent: (index: number, patch: Partial<StudentInfo>) => void;
  completed: DemoBooking | null;
  usedIds: ReadonlySet<string>;
  complete: () => void;
  startNewBooking: () => void;
  clearDemo: () => void;
};
const Context = createContext<DemoContext | null>(null);
function RemovalDialog({
  from,
  to,
  onCancel,
  onConfirm,
}: {
  from: number;
  to: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="action-dialog"
      aria-labelledby={title}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id={title}>ยืนยันลดจำนวนบัตร?</h2>
      <p>
        ลดจาก {from} เหลือ {to} ใบ จะลบข้อมูลนักศึกษาคนที่ {to + 1}
        {from > to + 1 ? `–${from}` : ""} ข้อมูลของคนที่เหลือจะยังอยู่
      </p>
      <div className="action-buttons">
        <button
          type="button"
          className="button outline"
          autoFocus
          onClick={onCancel}
        >
          เก็บข้อมูลไว้
        </button>
        <button type="button" className="button" onClick={onConfirm}>
          ยืนยันลบข้อมูลและลดจำนวน
        </button>
      </div>
    </dialog>
  );
}
/** Drafts and this tab's demo duplicate registry stay in memory, never URLs/storage. */
export function DemoBookingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const current = useRef(state);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);
  function commit(next: DemoState) {
    current.current = next;
    setState(next);
  }
  function applyQuantity(quantity: number) {
    const previous = current.current;
    commit({
      ...previous,
      students: resizeStudents(previous.students, quantity),
      completed: null,
      revision: previous.revision + 1,
    });
    setPendingQuantity(null);
  }
  return (
    <Context.Provider
      value={{
        revision: state.revision,
        quantity: state.students.length,
        students: state.students,
        completed: state.completed,
        usedIds: state.usedIds,
        setQuantity: (value) => {
          if (
            !validQuantity(value) ||
            value === current.current.students.length
          )
            return;
          if (needsRemovalConfirmation(current.current.students, value)) {
            setPendingQuantity(value);
            return;
          }
          applyQuantity(value);
        },
        updateStudent: (index, patch) => {
          const previous = current.current;
          if (index < 0 || index >= previous.students.length) return;
          if (
            Object.entries(patch).every(
              ([key, value]) =>
                previous.students[index][key as keyof StudentInfo] === value,
            )
          )
            return;
          commit({
            ...previous,
            students: previous.students.map((student, i) =>
              i === index ? { ...student, ...patch } : student,
            ),
            completed: null,
            revision: previous.revision + 1,
          });
        },
        complete: () => {
          const previous = current.current;
          const reference = `HH-DEMO-${crypto.randomUUID().toUpperCase()}`;
          const ids = previous.students.map(
            () => `HH-DEMO-TICKET-${crypto.randomUUID().toUpperCase()}`,
          );
          commit(confirmDemoState(previous, reference, ids));
        },
        startNewBooking: () => {
          commit({
            ...initialDemoState(),
            revision: current.current.revision + 1,
            usedIds: current.current.usedIds,
          });
          setPendingQuantity(null);
        },
        clearDemo: () => {
          commit({
            ...initialDemoState(),
            revision: current.current.revision + 1,
          });
          setPendingQuantity(null);
        },
      }}
    >
      {children}
      {pendingQuantity !== null && (
        <RemovalDialog
          from={state.students.length}
          to={pendingQuantity}
          onCancel={() => setPendingQuantity(null)}
          onConfirm={() => applyQuantity(pendingQuantity)}
        />
      )}
    </Context.Provider>
  );
}
export function useDemoBooking() {
  const context = useContext(Context);
  if (!context) throw new Error("DemoBookingProvider is required");
  return context;
}
