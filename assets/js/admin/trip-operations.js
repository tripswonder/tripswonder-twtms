import { db, collection, getDocs, addDoc, updateDoc, doc } from "../firebase/firebase-db.js";
import { requireAuth } from "../auth/auth-guard.js";
import { showLoading, hideLoading, showLoadingError } from "../shared/loading-screen.js";

let currentAdmin={uid:"",name:"Admin"};
requireAuth({allowedRoles:["owner","admin"],requiredPermission:"bookings",onAuthorized:(user,profile)=>{currentAdmin={uid:user?.uid||"",name:profile?.displayName||profile?.fullName||profile?.name||profile?.adminName||user?.displayName||user?.email||"Admin"};}});

document.addEventListener("DOMContentLoaded",()=>{
  const $=id=>document.getElementById(id);
  const els={grid:$("calendarGrid"),month:$("calendarMonthLabel"),dateModal:$("dateModal"),dateTitle:$("dateModalTitle"),tourSearch:$("tourSearch"),tourList:$("dateTourList"),manageModal:$("manageModal"),manageForm:$("manageForm"),manageTitle:$("manageTitle"),manageDates:$("manageDates"),manageStatus:$("manageStatus"),mBookings:$("mBookings"),mGuests:$("mGuests"),mDay0:$("mDay0"),mPickup:$("mPickup"),mAvailability:$("mAvailability"),mOperationStatus:$("mOperationStatus"),mAccommodation:$("mAccommodation"),mAccommodationSummary:$("mAccommodationSummary"),
    btnGenerateAccommodationGuestList:$("btnGenerateAccommodationGuestList"),
    accommodationGuestListModal:$("accommodationGuestListModal"),
    btnCloseAccommodationGuestList:$("btnCloseAccommodationGuestList"),
    accommodationGuestListSubtitle:$("accommodationGuestListSubtitle"),
    accommodationGuestListSummary:$("accommodationGuestListSummary"),
    accommodationGuestListNotice:$("accommodationGuestListNotice"),
    accommodationGuestListContent:$("accommodationGuestListContent"),
    walkInReservationModal:$("walkInReservationModal"),
    btnCloseWalkInModal:$("btnCloseWalkInModal"),
    btnCancelWalkIn:$("btnCancelWalkIn"),
    walkInReservationForm:$("walkInReservationForm"),
    walkInAccommodationLabel:$("walkInAccommodationLabel"),
    walkInResortName:$("walkInResortName"),
    walkInGuestName:$("walkInGuestName"),
    walkInUnits:$("walkInUnits"),
    walkInPax:$("walkInPax"),
    walkInNotes:$("walkInNotes"),
    btnSaveWalkIn:$("btnSaveWalkIn"),
    accommodationAssignmentModal:$("accommodationAssignmentModal"),
    btnCloseAssignmentModal:$("btnCloseAssignmentModal"),
    btnCancelAssignment:$("btnCancelAssignment"),
    accommodationAssignmentForm:$("accommodationAssignmentForm"),
    assignmentModalTitle:$("assignmentModalTitle"),
    assignmentModalSubtitle:$("assignmentModalSubtitle"),
    assignmentSource:$("assignmentSource"),
    assignmentRecordId:$("assignmentRecordId"),
    assignmentResortName:$("assignmentResortName"),
    assignmentAccommodation:$("assignmentAccommodation"),
    assignmentUnits:$("assignmentUnits"),
    assignmentPax:$("assignmentPax"),
    assignmentNotes:$("assignmentNotes"),
    btnSaveAssignment:$("btnSaveAssignment"),
    mGuestsList:$("mGuestsList"),mPickupTime:$("mPickupTime"),mVehicle:$("mVehicle"),mPlate:$("mPlate"),mDriver:$("mDriver"),mDriverContact:$("mDriverContact"),mCoordinator:$("mCoordinator"),mCoordinatorContact:$("mCoordinatorContact"),mDepartureNote:$("mDepartureNote"),mAnnouncement:$("mAnnouncement"),mActivity:$("mActivity"),createModal:$("createModal"),createForm:$("createForm"),createPackage:$("createPackage"),createStart:$("createStart"),createEnd:$("createEnd"),statOpen:$("statOpen"),statGuests:$("statGuests"),statOngoing:$("statOngoing"),statMonth:$("statMonth")};
  let packages=[],bookings=[],operations=[],selectedDate="",selectedOperation=null,currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);

  const pad=n=>String(n).padStart(2,"0");
  const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseDate=s=>{if(!s)return null;const [y,m,d]=String(s).slice(0,10).split("-").map(Number);return new Date(y,m-1,d)};
  const addDays=(s,n)=>{const d=parseDate(s);if(!d)return "";d.setDate(d.getDate()+n);return ymd(d)};
  const fmt=(s,opt={month:"short",day:"numeric",year:"numeric"})=>{const d=parseDate(s);return d?d.toLocaleDateString("en-US",opt):"—"};
  const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const durationDays=p=>Math.max(1,Number(p?.scheduleSettings?.durationDays)||Number(String(p?.duration||"").match(/\d+/)?.[0])||1);
  const isVisible=p=>{const s=String(p?.status||"").toLowerCase();return p?.hidden!==true&&p?.isHidden!==true&&p?.active!==false&&!['hidden','inactive','archived','disabled'].includes(s)};
  const settings=p=>({enabled:!!p?.scheduleSettings?.enabled,startDay:Number(p?.scheduleSettings?.startDay??5),durationDays:durationDays(p),day0Enabled:p?.scheduleSettings?.day0Enabled!==false,day0Offset:Number(p?.scheduleSettings?.day0Offset??-1),pickupTime:p?.scheduleSettings?.pickupStartTime||p?.scheduleSettings?.pickupTime||"",note:p?.scheduleSettings?.departureNote||""});
  const pkgById=id=>packages.find(p=>p.id===id);
  const opBookings=op=>bookings.filter(b=>(b.packageId===op.packageId||b.package?.id===op.packageId)&&String(b.startDate||b.travelStartDate||b.travelDate||"").slice(0,10)===String(op.startDate||"").slice(0,10)&&!['cancelled','rejected'].includes(String(b.status||"").toLowerCase()));
  const pax=b=>Number(b.totalPax||b.pax||b.guests||b.numberOfPax||1)||1;
  const availability=op=>String(op.bookingAvailability||"closed").toLowerCase();
  const openModal=m=>{m.classList.add("open");m.setAttribute("aria-hidden","false");document.body.style.overflow="hidden"};
  const closeModal=m=>{m.classList.remove("open");m.setAttribute("aria-hidden","true");if(!document.querySelector('.modal.open'))document.body.style.overflow=""};

  async function loadData(){showLoading?.("Loading trip operations...");try{const [pq,bq,oq]=await Promise.all([getDocs(collection(db,"packages")),getDocs(collection(db,"bookings")),getDocs(collection(db,"tripOperations"))]);packages=pq.docs.map(d=>({id:d.id,...d.data()}));bookings=bq.docs.map(d=>({id:d.id,...d.data()}));operations=oq.docs.map(d=>({id:d.id,...d.data()}));renderAll();hideLoading?.();}catch(e){console.error(e);showLoadingError?.("Unable to load Trip Operations.");}}
  async function reloadOperations(){const q=await getDocs(collection(db,"tripOperations"));operations=q.docs.map(d=>({id:d.id,...d.data()}));renderAll();}

  function renderAll(){renderCalendar();renderStats();fillPackageOptions();}
  function renderStats(){const today=ymd(new Date());const monthStart=ymd(new Date(currentMonth.getFullYear(),currentMonth.getMonth(),1));const monthEnd=ymd(new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1,0));const future=operations.filter(o=>o.endDate>=today);els.statOpen.textContent=future.filter(o=>['open','limited'].includes(availability(o))).length;els.statGuests.textContent=future.reduce((n,o)=>n+opBookings(o).reduce((x,b)=>x+pax(b),0),0);els.statOngoing.textContent=operations.filter(o=>String(o.status).toLowerCase()==='ongoing'||(o.startDate<=today&&o.endDate>=today)).length;els.statMonth.textContent=operations.filter(o=>o.startDate<=monthEnd&&o.endDate>=monthStart).length;}
  function renderCalendar() {
    els.month.textContent = currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const calendarStart = new Date(firstDay);
    calendarStart.setDate(1 - firstDay.getDay());

    const today = ymd(new Date());
    let html = "";

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);

      const dateString = ymd(date);
      const outsideMonth = date.getMonth() !== currentMonth.getMonth();

      // The master calendar only summarizes tours whose Day 1 starts
      // on this exact date. This keeps the calendar compact even when
      // hundreds of destinations exist.
      const startOperations = operations.filter(
        (operation) => operation.startDate === dateString
      );

      const openCount = startOperations.filter(
        (operation) => availability(operation) === "open"
      ).length;

      const limitedCount = startOperations.filter(
        (operation) => availability(operation) === "limited"
      ).length;

      const fullCount = startOperations.filter(
        (operation) => availability(operation) === "full"
      ).length;

      const closedCount = startOperations.filter((operation) =>
        ["closed", "completed"].includes(availability(operation))
      ).length;

      const day0Count = operations.filter(
        (operation) => operation.day0Date === dateString
      ).length;

      let summaryClass = "";

      if (openCount > 0) {
        summaryClass = "has-open";
      } else if (limitedCount > 0) {
        summaryClass = "has-limited";
      } else if (fullCount > 0) {
        summaryClass = "has-full";
      } else if (closedCount > 0) {
        summaryClass = "has-closed";
      }

      const statusSummary = startOperations.length
        ? `
          <div class="date-status-summary">
            ${
              openCount
                ? `
                  <span class="date-status open">
                    <i></i>${openCount} Open
                  </span>
                `
                : ""
            }

            ${
              limitedCount
                ? `
                  <span class="date-status limited">
                    <i></i>${limitedCount} Limited
                  </span>
                `
                : ""
            }

            ${
              fullCount
                ? `
                  <span class="date-status full">
                    <i></i>${fullCount} Full
                  </span>
                `
                : ""
            }

            ${
              closedCount
                ? `
                  <span class="date-status closed">
                    <i></i>${closedCount} Closed
                  </span>
                `
                : ""
            }
          </div>
        `
        : "";

      const day0Summary = day0Count
        ? `
          <div class="date-day0-summary">
            <span>D0</span>
            ${day0Count}
          </div>
        `
        : "";

      html += `
        <div
          class="day
            ${outsideMonth ? "outside" : ""}
            ${dateString < today ? "past" : ""}
            ${dateString === today ? "today" : ""}
            ${summaryClass}"
          data-date="${dateString}"
        >
          <div class="date-topline">
            <div class="date-num">${date.getDate()}</div>
            ${day0Summary}
          </div>

          ${statusSummary}
        </div>
      `;
    }

    els.grid.innerHTML = html;
  }

  function fillPackageOptions(){const visible=packages.filter(isVisible).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));els.createPackage.innerHTML='<option value="">Select package</option>'+visible.map(p=>`<option value="${p.id}">${esc(p.name||'Unnamed Package')}</option>`).join('');}
  function scheduleForDate(packageId,date){return operations.find(o=>o.packageId===packageId&&o.startDate===date)}
  function validRegularStart(p,date){const s=settings(p),d=parseDate(date);return s.enabled&&d&&d.getDay()===s.startDay;}
  function defaultInventory(packageItem) {
    return (packageItem?.accommodations || [])
      .filter(
        (accommodation) =>
          accommodation.active !== false &&
          !["hidden", "archived", "inactive", "disabled"].includes(
            String(accommodation.status || "active").toLowerCase()
          )
      )
      .map((accommodation) => {
        const defaultUnits = Math.max(
          0,
          Number(
            accommodation.defaultAvailableUnits ??
              accommodation.defaultUnits ??
              accommodation.availableUnits ??
              0
          ) || 0
        );

        return {
          accommodationId: accommodation.id || "",
          name: accommodation.name || "Accommodation",
          resortId:
            accommodation.resortId ||
            accommodation.resort?.id ||
            "",
          resortName:
            accommodation.resortName ||
            accommodation.resort?.name ||
            accommodation.propertyName ||
            "Unassigned Resort",
          type: accommodation.type || "additional",
          mainPhoto:
            accommodation.mainPhoto ||
            accommodation.photo ||
            "",
          pricePerNight:
            Number(
              accommodation.pricePerNight ??
                accommodation.price ??
                0
            ) || 0,
          maxGuests: Number(accommodation.maxGuests || 1),
          defaultUnits,
          availableUnits: defaultUnits,
          websiteReserved: 0,
          manualReserved: 0,
          manualReservations: [],
          blockedUnits: 0,
          maintenanceUnits: 0,
        };
      });
  }
  function buildOp(p,startDate,type='regular',endOverride=''){const s=settings(p);const endDate=endOverride||addDays(startDate,s.durationDays-1);const day0Date=s.day0Enabled?addDays(startDate,s.day0Offset):'';return {packageId:p.id,packageName:p.name||'',startDate,endDate,day0Date,day0PickupStart:s.pickupTime,day0Note:s.note,scheduleType:type,bookingAvailability:'open',status:'needs_setup',accommodationAvailability:defaultInventory(p),schedulePatternSnapshot:{...s},createdBy:currentAdmin,createdAt:new Date(),updatedBy:currentAdmin,updatedAt:new Date()};}

  function showDate(date){selectedDate=date;els.dateTitle.textContent=parseDate(date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});els.tourSearch.value='';renderDateTours();openModal(els.dateModal);}
  function renderDateTours() {
    const query = els.tourSearch.value.trim().toLowerCase();
    const visiblePackages = packages.filter(isVisible);

    // Compact default view:
    // - Existing/open tours for the selected date
    // - Valid regular schedules that can start on the selected date
    //
    // When Admin searches, all visible packages can be found for
    // creating a Custom Schedule when needed.
    let list = visiblePackages.filter((packageItem) => {
      const existing = scheduleForDate(packageItem.id, selectedDate);
      const validRegular = validRegularStart(packageItem, selectedDate);

      if (!query) {
        return Boolean(existing || validRegular);
      }

      const haystack =
        `${packageItem.name || ""} ${packageItem.location || ""}`.toLowerCase();

      return haystack.includes(query);
    });

    // Existing/open tours always appear first.
    list.sort((a, b) => {
      const aExisting = Boolean(scheduleForDate(a.id, selectedDate));
      const bExisting = Boolean(scheduleForDate(b.id, selectedDate));

      if (aExisting !== bExisting) {
        return aExisting ? -1 : 1;
      }

      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    if (!list.length) {
      els.tourList.innerHTML = query
        ? '<div class="empty">No matching tour found. Try another destination or package name.</div>'
        : '<div class="empty">No open tours or regular schedules for this date.<br><small>Use Search to find a package and create a custom schedule.</small></div>';
      return;
    }

    els.tourList.innerHTML = list
      .map((packageItem) => {
        const existing = scheduleForDate(packageItem.id, selectedDate);
        const schedule = settings(packageItem);
        const regular = validRegularStart(packageItem, selectedDate);
        const endDate = addDays(
          selectedDate,
          schedule.durationDays - 1
        );

        const image =
          packageItem.image ||
          packageItem.coverPhoto ||
          packageItem.gallery?.[0]?.url ||
          packageItem.gallery?.[0] ||
          "";

        let action = "";
        let statusLine = "";

        if (existing) {
          const guestCount = opBookings(existing).reduce(
            (total, booking) => total + pax(booking),
            0
          );

          action = `
            <button
              class="btn primary row-action"
              data-manage="${existing.id}"
              type="button"
            >
              Manage Tour
            </button>
          `;

          statusLine = `
            <span class="tour-status-open">
              ● ${esc(availability(existing).toUpperCase())}
            </span>
            · ${guestCount} guests
          `;
        } else if (regular) {
          action = `
            <button
              class="btn ghost row-action"
              data-open-package="${packageItem.id}"
              type="button"
            >
              Open Schedule
            </button>
          `;

          statusLine = "Regular schedule · ready to open";
        } else {
          // Only shown after an Admin search.
          action = `
            <button
              class="btn ghost row-action"
              data-custom-package="${packageItem.id}"
              type="button"
            >
              Custom Schedule
            </button>
          `;

          statusLine = schedule.enabled
            ? `Regular start is ${
                [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ][schedule.startDay]
              }`
            : "Regular schedule is off";
        }

        return `
          <article class="tour-row">
            <img
              class="tour-thumb"
              src="${esc(image)}"
              alt=""
              onerror="this.style.visibility='hidden'"
            >

            <div class="tour-row-info">
              <h3>${esc(packageItem.name || "Unnamed Package")}</h3>

              <p>
                ${fmt(selectedDate, { month: "short", day: "numeric" })}
                –
                ${fmt(endDate, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                · ${schedule.durationDays}D${Math.max(
                  0,
                  schedule.durationDays - 1
                )}N
              </p>

              <div class="status-line">
                ${statusLine}
              </div>
            </div>

            ${action}
          </article>
        `;
      })
      .join("");
  }

  async function openRegular(packageId){const p=pkgById(packageId);if(!p||scheduleForDate(packageId,selectedDate))return;showLoading?.('Opening schedule...');try{await addDoc(collection(db,'tripOperations'),buildOp(p,selectedDate,'regular'));await reloadOperations();renderDateTours();hideLoading?.();}catch(e){console.error(e);hideLoading?.();alert('Unable to open schedule.');}}
  function showManage(id){selectedOperation=operations.find(o=>o.id===id);if(!selectedOperation)return;const p=pkgById(selectedOperation.packageId);const bs=opBookings(selectedOperation);const totalGuests=bs.reduce((n,b)=>n+pax(b),0);els.manageTitle.textContent=p?.name||selectedOperation.packageName||'Tour Schedule';els.manageDates.textContent=`${fmt(selectedOperation.startDate)} – ${fmt(selectedOperation.endDate)}`;els.manageStatus.textContent=`${availability(selectedOperation).toUpperCase()} · ${String(selectedOperation.scheduleType||'regular').toUpperCase()}`;els.mBookings.textContent=bs.length;els.mGuests.textContent=totalGuests;els.mDay0.textContent=selectedOperation.day0Date?fmt(selectedOperation.day0Date,{month:'short',day:'numeric'}):'Disabled';els.mPickup.textContent=selectedOperation.day0PickupStart||selectedOperation.pickupTime||'Not set';els.mAvailability.value=availability(selectedOperation);els.mOperationStatus.value=selectedOperation.status||'needs_setup';els.mPickupTime.value=selectedOperation.day0PickupStart||selectedOperation.pickupTime||'';els.mVehicle.value=selectedOperation.vehicleName||'';els.mPlate.value=selectedOperation.vehiclePlate||selectedOperation.plateNumber||'';els.mDriver.value=selectedOperation.driverName||'';els.mDriverContact.value=selectedOperation.driverContact||'';els.mCoordinator.value=selectedOperation.coordinatorName||'';els.mCoordinatorContact.value=selectedOperation.coordinatorContact||'';els.mDepartureNote.value=selectedOperation.day0Note||'';els.mAnnouncement.value=selectedOperation.announcement||'';renderAccommodation(p);renderGuests(bs);renderActivity();setTab('overview');closeModal(els.dateModal);openModal(els.manageModal);}

  function bookingAccommodationEntries(booking) {
    const entries = [];

    const addEntry = (value, id = "") => {
      if (!value) return;

      if (typeof value === "object") {
        const name =
          value.name ||
          value.accommodationName ||
          value.title ||
          "";

        const accommodationId =
          value.accommodationId ||
          value.id ||
          id ||
          "";

        if (name || accommodationId) {
          entries.push({
            name: String(name || "").trim(),
            id: String(accommodationId || "").trim(),
          });
        }

        return;
      }

      entries.push({
        name: String(value).trim(),
        id: String(id || "").trim(),
      });
    };

    addEntry(
      booking.accommodation,
      booking.accommodationId
    );

    addEntry(
      booking.accommodationName,
      booking.accommodationId
    );

    addEntry(
      booking.selectedAccommodation,
      booking.accommodationId
    );

    [
      booking.addons,
      booking.addOns,
      booking.bookingAddons,
    ].forEach((list) => {
      if (!Array.isArray(list)) return;

      list.forEach((addon) => {
        const category = String(
          addon?.category ||
            addon?.type ||
            ""
        ).toLowerCase();

        if (
          category.includes("accommodation") ||
          category.includes("room") ||
          addon?.accommodationId
        ) {
          addEntry(
            addon,
            addon?.accommodationId
          );
        }
      });
    });

    return entries.filter(
      (entry, index, list) =>
        (entry.name || entry.id) &&
        list.findIndex(
          (candidate) =>
            candidate.name.toLowerCase() ===
              entry.name.toLowerCase() &&
            candidate.id === entry.id
        ) === index
    );
  }

  function bookingUsesAccommodation(
    booking,
    accommodation,
    packageItem
  ) {
    const accommodationId = String(
      accommodation.accommodationId || ""
    ).trim();

    const accommodationName = String(
      accommodation.name || ""
    )
      .trim()
      .toLowerCase();

    const entries =
      bookingAccommodationEntries(booking);

    const directMatch = entries.some((entry) => {
      const entryId = String(entry.id || "").trim();
      const entryName = String(entry.name || "")
        .trim()
        .toLowerCase();

      if (
        accommodationId &&
        entryId &&
        accommodationId === entryId
      ) {
        return true;
      }

      return (
        accommodationName &&
        entryName &&
        accommodationName === entryName
      );
    });

    if (directMatch) {
      return true;
    }

    // Compatibility for older bookings that only stored
    // "Standard / Package Included" instead of the exact room name.
    const isIncluded = String(
      accommodation.type || ""
    )
      .toLowerCase()
      .includes("included");

    const hasGenericIncluded = entries.some((entry) =>
      /standard|package included|included accommodation/i.test(
        entry.name
      )
    );

    if (!isIncluded || !hasGenericIncluded) {
      return false;
    }

    const activeIncluded =
      (packageItem?.accommodations || []).filter(
        (item) =>
          item.active !== false &&
          ![
            "hidden",
            "archived",
            "inactive",
            "disabled",
          ].includes(
            String(item.status || "active").toLowerCase()
          ) &&
          String(item.type || "included")
            .toLowerCase()
            .includes("included")
      );

    const firstIncluded = activeIncluded[0];

    return Boolean(
      firstIncluded &&
        (
          String(firstIncluded.id || "") ===
            accommodationId ||
          String(firstIncluded.name || "")
            .trim()
            .toLowerCase() === accommodationName
        )
    );
  }

  function accommodationBookingList(
    accommodation,
    packageItem
  ) {
    const scheduleBookings =
      opBookings(selectedOperation);

    return scheduleBookings.filter((booking) =>
      bookingUsesAccommodation(
        booking,
        accommodation,
        packageItem
      )
    );
  }

  function bookingGuestName(booking) {
    return (
      booking.customerName ||
      booking.fullName ||
      booking.name ||
      booking.customer?.name ||
      booking.customer?.fullName ||
      "Customer"
    );
  }

  function renderAccommodationUsers(
    accommodation,
    packageItem
  ) {
    const matchedBookings =
      accommodationBookingList(
        accommodation,
        packageItem
      );

    const totalPax = matchedBookings.reduce(
      (sum, booking) => sum + pax(booking),
      0
    );

    if (!matchedBookings.length) {
      return `
        <details class="acc-booking-list">
          <summary>
            <span class="acc-booking-list-title">
              <i class="bi bi-people"></i>
              Guests / Bookings
            </span>

            <span class="acc-booking-count">
              0 booking
            </span>
          </summary>

          <div class="acc-booking-empty">
            No booking is currently assigned to this accommodation.
          </div>
        </details>
      `;
    }

    return `
      <details class="acc-booking-list">
        <summary>
          <span class="acc-booking-list-title">
            <i class="bi bi-people"></i>
            Guests / Bookings
          </span>

          <span class="acc-booking-count">
            ${matchedBookings.length}
            ${matchedBookings.length === 1 ? "booking" : "bookings"}
            · ${totalPax} pax
          </span>
        </summary>

        <div class="acc-booking-rows">
          ${matchedBookings
            .map((booking) => {
              const reference =
                booking.bookingReference ||
                booking.reference ||
                booking.id;

              const status = String(
                booking.status || "Booking"
              );

              return `
                <div class="acc-booking-row">
                  <div class="acc-booking-avatar">
                    ${esc(
                      String(
                        bookingGuestName(booking)
                      )
                        .trim()
                        .charAt(0)
                        .toUpperCase() || "G"
                    )}
                  </div>

                  <div class="acc-booking-person">
                    <strong>
                      ${esc(
                        bookingGuestName(booking)
                      )}
                    </strong>

                    <span>
                      ${esc(reference)}
                    </span>
                  </div>

                  <div class="acc-booking-meta">
                    <strong>
                      ${pax(booking)} pax
                    </strong>

                    <span>
                      ${esc(status)}
                    </span>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </details>
    `;
  }



  let walkInAccommodationIndex = null;

  function masterPackageAccommodation(
    accommodation,
    packageItem = null
  ) {
    const activePackage =
      packageItem ||
      (
        selectedOperation
          ? pkgById(selectedOperation.packageId)
          : null
      );

    const masterList = Array.isArray(
      activePackage?.accommodations
    )
      ? activePackage.accommodations
      : [];

    const accommodationId = String(
      accommodation?.accommodationId ||
      accommodation?.id ||
      ""
    ).trim();

    const accommodationName = String(
      accommodation?.name ||
      accommodation?.accommodationName ||
      ""
    ).trim().toLowerCase();

    return (
      masterList.find((item) => {
        const masterId = String(
          item?.id ||
          item?.accommodationId ||
          ""
        ).trim();

        return (
          accommodationId &&
          masterId &&
          accommodationId === masterId
        );
      }) ||
      masterList.find((item) => {
        const masterName = String(
          item?.name ||
          item?.accommodationName ||
          ""
        ).trim().toLowerCase();

        return (
          accommodationName &&
          masterName === accommodationName
        );
      }) ||
      null
    );
  }

  function accommodationResortName(
    accommodation,
    packageItem = null
  ) {
    const master =
      masterPackageAccommodation(
        accommodation,
        packageItem
      );

    return (
      accommodation?.resortName ||
      accommodation?.resort?.name ||
      accommodation?.propertyName ||
      master?.resortName ||
      master?.resort?.name ||
      master?.propertyName ||
      "Unassigned Resort"
    );
  }

  function normalizeManualReservations(accommodation) {
    if (!Array.isArray(accommodation?.manualReservations)) {
      return [];
    }

    return accommodation.manualReservations
      .filter(Boolean)
      .map((reservation, index) => ({
        // Preserve operational fields such as status, releasedAt,
        // releasedBy, updatedAt and updatedBy.
        ...reservation,

        id:
          reservation.id ||
          `manual-${index + 1}`,

        resortName:
          reservation.resortName ||
          accommodationResortName(accommodation),

        guestName:
          reservation.guestName ||
          reservation.name ||
          "Walk-in / Manual",

        units: Math.max(
          1,
          Number(
            reservation.units ||
            reservation.quantity ||
            1
          )
        ),

        pax: Math.max(
          0,
          Number(
            reservation.pax ||
            reservation.guests ||
            0
          )
        ),

        notes: reservation.notes || "",
        source:
          reservation.source ||
          "walk_in",

        // Old records without a status are still active.
        status:
          reservation.status ||
          "active",

        createdAt:
          reservation.createdAt ||
          null,

        createdBy:
          reservation.createdBy ||
          null,
      }));
  }

  function bookingAccommodationQuantity(
    booking,
    accommodation
  ) {
    const accommodationId = String(
      accommodation.accommodationId || ""
    );

    const accommodationName = String(
      accommodation.name || ""
    ).toLowerCase();

    const addonLists = [
      booking.addons,
      booking.addOns,
      booking.bookingAddons,
    ].filter(Array.isArray);

    for (const list of addonLists) {
      for (const addon of list) {
        const addonId = String(
          addon?.accommodationId || addon?.id || ""
        );

        const addonName = String(
          addon?.name ||
            addon?.accommodationName ||
            addon?.title ||
            ""
        ).toLowerCase();

        if (
          (accommodationId &&
            addonId &&
            accommodationId === addonId) ||
          (accommodationName &&
            addonName === accommodationName)
        ) {
          return Math.max(
            1,
            Number(
              addon.quantity ||
                addon.units ||
                addon.rooms ||
                1
            )
          );
        }
      }
    }

    return Math.max(
      1,
      Number(
        booking.accommodationQuantity ||
          booking.roomQuantity ||
          booking.units ||
          1
      )
    );
  }

  function closeWalkInModal() {
    if (!els.walkInReservationModal) return;

    els.walkInReservationModal.classList.remove("show");
    els.walkInReservationModal.setAttribute(
      "aria-hidden",
      "true"
    );

    walkInAccommodationIndex = null;
  }

  function openWalkInModal(index) {
    if (!selectedOperation) return;

    const packageItem =
      pkgById(selectedOperation.packageId);

    const inventory = Array.isArray(
      selectedOperation.accommodationAvailability
    )
      ? selectedOperation.accommodationAvailability
      : defaultInventory(packageItem);

    const accommodation = inventory[index];

    if (!accommodation) return;

    walkInAccommodationIndex = index;

    els.walkInAccommodationLabel.textContent =
      `${accommodationResortName(accommodation)} · ` +
      `${accommodation.name || "Accommodation"}`;

    els.walkInResortName.value =
      accommodationResortName(accommodation) ===
      "Unassigned Resort"
        ? ""
        : accommodationResortName(accommodation);

    els.walkInGuestName.value =
      accommodationResortName(accommodation) ===
      "Unassigned Resort"
        ? ""
        : `${accommodationResortName(accommodation)} Walk-in`;

    els.walkInUnits.value = "1";
    els.walkInPax.value = "0";
    els.walkInNotes.value = "";

    els.walkInReservationModal.classList.add("show");
    els.walkInReservationModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  async function saveWalkInReservation(event) {
    event.preventDefault();

    if (
      walkInAccommodationIndex === null ||
      !selectedOperation
    ) {
      return;
    }

    const packageItem =
      pkgById(selectedOperation.packageId);

    const inventory = Array.isArray(
      selectedOperation.accommodationAvailability
    )
      ? selectedOperation.accommodationAvailability
      : defaultInventory(packageItem);

    const updated = inventory.map((item, index) => {
      if (index !== walkInAccommodationIndex) {
        return item;
      }

      const manualReservations =
        normalizeManualReservations(item);

      const newReservation = {
        id:
          `manual-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
        resortName:
          els.walkInResortName.value.trim(),
        guestName:
          els.walkInGuestName.value.trim(),
        units: Math.max(
          1,
          Number(els.walkInUnits.value || 1)
        ),
        pax: Math.max(
          0,
          Number(els.walkInPax.value || 0)
        ),
        notes: els.walkInNotes.value.trim(),
        source: "walk_in",
        createdAt: new Date(),
        createdBy: currentAdmin,
      };

      const nextManualReservations = [
        ...manualReservations,
        newReservation,
      ];

      const manualReserved =
        nextManualReservations.reduce(
          (sum, reservation) =>
            sum +
            Math.max(
              1,
              Number(reservation.units || 1)
            ),
          0
        );

      const defaultUnits = Math.max(
        0,
        Number(
          item.defaultUnits ??
            item.availableUnits ??
            0
        ) || 0
      );

      const websiteReserved = Math.max(
        0,
        Number(item.websiteReserved || 0)
      );

      const blockedUnits = Math.max(
        0,
        Number(item.blockedUnits || 0)
      );

      const maintenanceUnits = Math.max(
        0,
        Number(item.maintenanceUnits || 0)
      );

      return {
        ...item,
        resortName:
          newReservation.resortName ||
          accommodationResortName(item),
        defaultUnits,
        manualReservations:
          nextManualReservations,
        manualReserved,
        availableUnits: Math.max(
          0,
          defaultUnits -
            websiteReserved -
            manualReserved -
            blockedUnits -
            maintenanceUnits
        ),
      };
    });

    const button = els.btnSaveWalkIn;
    const originalHTML = button.innerHTML;

    button.disabled = true;
    button.innerHTML = `
      <span class="btn-spinner"></span>
      Saving...
    `;

    try {
      await updateDoc(
        doc(
          db,
          "tripOperations",
          selectedOperation.id
        ),
        {
          accommodationAvailability: updated,
          accommodationAvailabilityAudit: {
            uid: currentAdmin.uid,
            name: currentAdmin.name,
            updatedAt: new Date(),
          },
          updatedBy: currentAdmin,
          updatedAt: new Date(),
        }
      );

      await reloadOperations();

      selectedOperation = operations.find(
        (operation) =>
          operation.id === selectedOperation.id
      );

      closeWalkInModal();

      renderAccommodation(
        pkgById(selectedOperation.packageId)
      );
    } catch (error) {
      console.error(error);
      alert(
        "Unable to save the walk-in reservation."
      );
    } finally {
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  }



  function showGuestListNotice(
    message,
    type = "success"
  ) {
    if (!els.accommodationGuestListNotice) return;

    els.accommodationGuestListNotice.hidden = false;
    els.accommodationGuestListNotice.className =
      `guest-list-notice ${type}`;

    els.accommodationGuestListNotice.innerHTML = `
      <i class="bi ${
        type === "success"
          ? "bi-check-circle-fill"
          : "bi-exclamation-circle-fill"
      }"></i>
      <span>${esc(message)}</span>
    `;

    window.clearTimeout(
      showGuestListNotice._timer
    );

    showGuestListNotice._timer =
      window.setTimeout(() => {
        if (els.accommodationGuestListNotice) {
          els.accommodationGuestListNotice.hidden =
            true;
        }
      }, 3200);
  }

  function setRowActionLoading(
    button,
    loadingText
  ) {
    if (!button) return () => {};

    const originalHTML = button.innerHTML;
    const originalDisabled = button.disabled;

    button.disabled = true;
    button.innerHTML = `
      <span class="btn-spinner btn-spinner-small"></span>
      ${esc(loadingText)}
    `;

    return () => {
      button.disabled = originalDisabled;
      button.innerHTML = originalHTML;
    };
  }

  function normalizeAccommodationAssignments(operation) {
    if (!Array.isArray(operation?.accommodationAssignments)) {
      return [];
    }

    return operation.accommodationAssignments
      .filter(Boolean)
      .map((assignment) => ({
        ...assignment,
        bookingId: String(assignment.bookingId || ""),
        status: String(assignment.status || "active"),
        units: Math.max(1, Number(assignment.units || 1)),
      }));
  }

  function bookingAssignmentOverride(booking) {
    return (
      normalizeAccommodationAssignments(selectedOperation)
        .filter(
          (assignment) =>
            assignment.bookingId === String(booking.id)
        )
        .slice(-1)[0] || null
    );
  }

  function bookingAssignedToAccommodation(
    booking,
    accommodation,
    packageItem
  ) {
    const override = bookingAssignmentOverride(booking);

    if (override) {
      if (override.status === "released") return false;

      const sameId =
        override.accommodationId &&
        accommodation.accommodationId &&
        String(override.accommodationId) ===
          String(accommodation.accommodationId);

      const sameName =
        String(override.accommodationName || "")
          .trim()
          .toLowerCase() ===
        String(accommodation.name || "")
          .trim()
          .toLowerCase();

      return Boolean(sameId || sameName);
    }

    return bookingUsesAccommodation(
      booking,
      accommodation,
      packageItem
    );
  }

  function bookingAssignedUnits(booking, accommodation) {
    const override = bookingAssignmentOverride(booking);

    if (override && override.status !== "released") {
      return Math.max(1, Number(override.units || 1));
    }

    return bookingAccommodationQuantity(
      booking,
      accommodation
    );
  }

  function activeManualReservations(accommodation) {
    return normalizeManualReservations(
      accommodation
    ).filter(
      (reservation) =>
        String(
          reservation.status || "active"
        )
          .trim()
          .toLowerCase() !== "released"
    );
  }


  function releasedManualReservations(accommodation) {
    return normalizeManualReservations(
      accommodation
    ).filter(
      (reservation) =>
        String(
          reservation.status || ""
        )
          .trim()
          .toLowerCase() === "released"
    );
  }


  function normalizeReleasedAccommodationHistory(operation) {
    if (!Array.isArray(operation?.releasedAccommodationReservations)) {
      return [];
    }

    return operation.releasedAccommodationReservations
      .filter(Boolean)
      .map((record) => ({
        ...record,
        status: "released",
      }));
  }


  function assignmentInventory() {
    const packageItem =
      pkgById(selectedOperation?.packageId);

    return Array.isArray(
      selectedOperation?.accommodationAvailability
    )
      ? selectedOperation.accommodationAvailability
      : defaultInventory(packageItem);
  }

  function fillAssignmentAccommodationOptions(
    selectedId = "",
    selectedName = ""
  ) {
    const inventory = assignmentInventory();

    els.assignmentAccommodation.innerHTML =
      inventory
        .map((item, index) => {
          const value =
            item.accommodationId || `index:${index}`;

          const selected =
            (selectedId &&
              String(item.accommodationId || "") ===
                String(selectedId)) ||
            (!selectedId &&
              selectedName &&
              String(item.name || "").toLowerCase() ===
                String(selectedName).toLowerCase());

          return `
            <option
              value="${esc(value)}"
              data-index="${index}"
              data-resort-name="${esc(accommodationResortName(item))}"
              ${selected ? "selected" : ""}
            >
              ${esc(
                `${accommodationResortName(item)} — ${item.name || "Accommodation"}`
              )}
            </option>
          `;
        })
        .join("");
  }

  function selectedAssignmentAccommodation() {
    const option =
      els.assignmentAccommodation?.selectedOptions?.[0];

    if (!option) return null;

    return assignmentInventory()[
      Number(option.dataset.index)
    ] || null;
  }

  function syncAssignmentResortFromAccommodation() {
    const target =
      selectedAssignmentAccommodation();

    if (!els.assignmentResortName) return;

    els.assignmentResortName.value =
      target
        ? (
            accommodationResortName(target) ===
            "Unassigned Resort"
              ? ""
              : accommodationResortName(target)
          )
        : "";
  }

  els.assignmentAccommodation?.addEventListener(
    "change",
    syncAssignmentResortFromAccommodation
  );

  function closeAssignmentModal() {
    if (!els.accommodationAssignmentModal) return;

    els.accommodationAssignmentModal.classList.remove("show");
    els.accommodationAssignmentModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  function openWebsiteAssignmentEditor(bookingId) {
    const booking =
      bookings.find(
        (item) => String(item.id) === String(bookingId)
      );

    if (!booking) return;

    const override = bookingAssignmentOverride(booking);
    const packageItem =
      pkgById(selectedOperation.packageId);

    const currentAccommodation =
      assignmentInventory().find((item) =>
        bookingAssignedToAccommodation(
          booking,
          item,
          packageItem
        )
      );

    els.assignmentModalTitle.textContent =
      "Edit Website Booking";

    els.assignmentModalSubtitle.textContent =
      `${bookingGuestName(booking)} · ${
        booking.bookingReference ||
        booking.reference ||
        booking.id
      }`;

    els.assignmentSource.value = "website";
    els.assignmentRecordId.value = booking.id;

    fillAssignmentAccommodationOptions(
      override?.accommodationId ||
        currentAccommodation?.accommodationId ||
        "",
      override?.accommodationName ||
        currentAccommodation?.name ||
        ""
    );

    syncAssignmentResortFromAccommodation();

    els.assignmentUnits.value =
      override?.units ||
      bookingAssignedUnits(
        booking,
        currentAccommodation || {}
      );

    els.assignmentPax.value = pax(booking);
    els.assignmentPax.disabled = true;
    els.assignmentNotes.value =
      override?.notes || "";

    els.accommodationAssignmentModal.classList.add("show");
    els.accommodationAssignmentModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  function findManualReservation(reservationId) {
    const inventory = assignmentInventory();

    for (
      let index = 0;
      index < inventory.length;
      index += 1
    ) {
      const reservation =
        normalizeManualReservations(inventory[index]).find(
          (item) =>
            String(item.id) === String(reservationId)
        );

      if (reservation) {
        return {
          reservation,
          accommodation: inventory[index],
          accommodationIndex: index,
        };
      }
    }

    return null;
  }

  function openWalkInAssignmentEditor(reservationId) {
    const found = findManualReservation(reservationId);

    if (!found) return;

    const { reservation, accommodation } = found;

    els.assignmentModalTitle.textContent =
      "Edit Walk-in / Resort Booking";

    els.assignmentModalSubtitle.textContent =
      reservation.guestName || "Walk-in / Manual";

    els.assignmentSource.value = "walk_in";
    els.assignmentRecordId.value = reservation.id;

    fillAssignmentAccommodationOptions(
      accommodation.accommodationId || "",
      accommodation.name || ""
    );

    syncAssignmentResortFromAccommodation();

    els.assignmentUnits.value =
      reservation.units || 1;

    els.assignmentPax.value =
      reservation.pax || 0;

    els.assignmentPax.disabled = false;
    els.assignmentNotes.value =
      reservation.notes || "";

    els.accommodationAssignmentModal.classList.add("show");
    els.accommodationAssignmentModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  function recalcManualInventory(inventory) {
    return inventory.map((item) => {
      const active =
        activeManualReservations(item);

      const manualReserved =
        active.reduce(
          (sum, reservation) =>
            sum +
            Math.max(
              1,
              Number(reservation.units || 1)
            ),
          0
        );

      const defaultUnits = Math.max(
        0,
        Number(
          item.defaultUnits ??
            item.availableUnits ??
            0
        ) || 0
      );

      return {
        ...item,
        manualReserved,
        availableUnits: Math.max(
          0,
          defaultUnits -
            Number(item.websiteReserved || 0) -
            manualReserved -
            Number(item.blockedUnits || 0) -
            Number(item.maintenanceUnits || 0)
        ),
      };
    });
  }


  function accommodationKey(item) {
    return String(
      item?.accommodationId ||
      item?.name ||
      ""
    ).trim().toLowerCase();
  }

  function websiteReservedUnitsForAccommodation(
    accommodation,
    excludeBookingId = ""
  ) {
    if (!selectedOperation) return 0;

    const packageItem =
      pkgById(selectedOperation.packageId);

    return opBookings(selectedOperation)
      .filter(
        (booking) =>
          String(booking.id) !==
            String(excludeBookingId) &&
          bookingAssignedToAccommodation(
            booking,
            accommodation,
            packageItem
          )
      )
      .reduce(
        (sum, booking) =>
          sum +
          bookingAssignedUnits(
            booking,
            accommodation
          ),
        0
      );
  }

  function manualReservedUnitsForAccommodation(
    accommodation,
    excludeReservationId = ""
  ) {
    return activeManualReservations(
      accommodation
    )
      .filter(
        (reservation) =>
          String(reservation.id) !==
          String(excludeReservationId)
      )
      .reduce(
        (sum, reservation) =>
          sum +
          Math.max(
            1,
            Number(reservation.units || 1)
          ),
        0
      );
  }

  function availableUnitsForAssignment(
    accommodation,
    source,
    recordId
  ) {
    const starting = Math.max(
      0,
      Number(
        accommodation.defaultUnits ??
        accommodation.startingUnits ??
        accommodation.availableUnits ??
        0
      ) || 0
    );

    const website =
      websiteReservedUnitsForAccommodation(
        accommodation,
        source === "website" ? recordId : ""
      );

    const walkIn =
      manualReservedUnitsForAccommodation(
        accommodation,
        source === "walk_in" ? recordId : ""
      );

    const blocked = Math.max(
      0,
      Number(accommodation.blockedUnits || 0)
    );

    const maintenance = Math.max(
      0,
      Number(accommodation.maintenanceUnits || 0)
    );

    return Math.max(
      0,
      starting -
        website -
        walkIn -
        blocked -
        maintenance
    );
  }

  async function saveAccommodationAssignment(event) {
    event.preventDefault();

    if (!selectedOperation) return;

    const source = els.assignmentSource.value;
    const recordId = els.assignmentRecordId.value;
    const target = selectedAssignmentAccommodation();

    if (!target) return;

    const resortName =
      accommodationResortName(target);

    if (
      !resortName ||
      resortName === "Unassigned Resort"
    ) {
      alert(
        "This accommodation has no Resort Name in Packages. Please complete the resort details in Packages first."
      );
      return;
    }

    const units = Math.max(
      1,
      Number(els.assignmentUnits.value || 1)
    );

    const availableUnits =
      availableUnitsForAssignment(
        target,
        source,
        recordId
      );

    if (units > availableUnits) {
      alert(
        `Only ${availableUnits} unit${
          availableUnits === 1 ? "" : "s"
        } available for ${target.name || "this accommodation"}.`
      );
      return;
    }

    const notes =
      els.assignmentNotes.value.trim();

    const button = els.btnSaveAssignment;
    const originalHTML = button.innerHTML;

    button.disabled = true;
    button.innerHTML = `
      <span class="btn-spinner"></span>
      Saving...
    `;

    try {
      if (source === "website") {
        const assignments =
          normalizeAccommodationAssignments(
            selectedOperation
          ).filter(
            (assignment) =>
              assignment.bookingId !== String(recordId)
          );

        assignments.push({
          bookingId: String(recordId),
          source: "website",
          status: "active",
          resortName,
          accommodationId:
            target.accommodationId || "",
          accommodationName:
            target.name || "",
          units,
          notes,
          updatedAt: new Date(),
          updatedBy: currentAdmin,
        });

        const inventory =
          assignmentInventory().map(
            (item) => {
              const websiteReserved =
                opBookings(selectedOperation)
                  .reduce(
                    (sum, booking) => {
                      const assignment =
                        String(booking.id) ===
                        String(recordId)
                          ? assignments
                              .filter(
                                (entry) =>
                                  entry.bookingId ===
                                  String(recordId)
                              )
                              .slice(-1)[0]
                          : bookingAssignmentOverride(
                              booking
                            );

                      if (
                        assignment &&
                        assignment.status ===
                          "released"
                      ) {
                        return sum;
                      }

                      const matchesTarget =
                        assignment
                          ? (
                              (
                                assignment.accommodationId &&
                                item.accommodationId &&
                                String(
                                  assignment.accommodationId
                                ) ===
                                  String(
                                    item.accommodationId
                                  )
                              ) ||
                              String(
                                assignment.accommodationName ||
                                ""
                              )
                                .trim()
                                .toLowerCase() ===
                                String(item.name || "")
                                  .trim()
                                  .toLowerCase()
                            )
                          : bookingUsesAccommodation(
                              booking,
                              item,
                              pkgById(
                                selectedOperation.packageId
                              )
                            );

                      if (!matchesTarget) {
                        return sum;
                      }

                      return (
                        sum +
                        (
                          assignment
                            ? Math.max(
                                1,
                                Number(
                                  assignment.units || 1
                                )
                              )
                            : bookingAccommodationQuantity(
                                booking,
                                item
                              )
                        )
                      );
                    },
                    0
                  );

              return {
                ...item,
                websiteReserved,
              };
            }
          );

        await updateDoc(
          doc(
            db,
            "tripOperations",
            selectedOperation.id
          ),
          {
            accommodationAssignments:
              assignments,
            accommodationAvailability:
              recalcManualInventory(inventory),
            updatedBy: currentAdmin,
            updatedAt: new Date(),
          }
        );
      } else {
        const found =
          findManualReservation(recordId);

        if (!found) return;

        const inventory =
          assignmentInventory().map((item) => ({
            ...item,
            manualReservations:
              normalizeManualReservations(item).filter(
                (reservation) =>
                  String(reservation.id) !==
                  String(recordId)
              ),
          }));

        const targetIndex =
          assignmentInventory().findIndex(
            (item) =>
              (
                target.accommodationId &&
                String(item.accommodationId) ===
                  String(target.accommodationId)
              ) ||
              String(item.name || "") ===
                String(target.name || "")
          );

        if (targetIndex >= 0) {
          inventory[targetIndex]
            .manualReservations.push({
              ...found.reservation,
              status: "active",
              resortName,
              units,
              pax: Math.max(
                0,
                Number(
                  els.assignmentPax.value ||
                  found.reservation.pax ||
                  0
                )
              ),
              notes,
              updatedAt: new Date(),
              updatedBy: currentAdmin,
            });
        }

        await updateDoc(
          doc(
            db,
            "tripOperations",
            selectedOperation.id
          ),
          {
            accommodationAvailability:
              recalcManualInventory(inventory),
            updatedBy: currentAdmin,
            updatedAt: new Date(),
          }
        );
      }

      await reloadOperations();

      selectedOperation =
        operations.find(
          (operation) =>
            operation.id === selectedOperation.id
        );

      closeAssignmentModal();

      renderAccommodation(
        pkgById(selectedOperation.packageId)
      );

      await openAccommodationGuestList();

      showGuestListNotice(
        source === "website"
          ? "Booking accommodation updated. The old slot was released and the new slot is reserved."
          : "Walk-in accommodation updated. The old slot was released and the new slot is reserved.",
        "success"
      );
    } catch (error) {
      console.error(
        "Save accommodation assignment error:",
        error
      );

      alert(
        "Unable to save the accommodation assignment."
      );
    } finally {
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  }

  async function releaseWebsiteSlot(
    bookingId,
    button = null
  ) {
    const booking =
      bookings.find(
        (item) =>
          String(item.id) === String(bookingId)
      );

    if (!booking) {
      showGuestListNotice(
        "Booking record was not found.",
        "error"
      );
      return;
    }

    if (
      !confirm(
        `Release accommodation slot for ${bookingGuestName(booking)}?`
      )
    ) {
      return;
    }

    const restoreButton =
      setRowActionLoading(
        button,
        "Releasing..."
      );

    try {
      const current =
        bookingAssignmentOverride(booking);

      const assignments =
        normalizeAccommodationAssignments(
          selectedOperation
        ).filter(
          (assignment) =>
            assignment.bookingId !==
            String(bookingId)
        );

      assignments.push({
        ...(current || {}),
        bookingId: String(bookingId),
        source: "website",
        status: "released",
        releasedAt: new Date(),
        releasedBy: currentAdmin,
      });

      await updateDoc(
        doc(
          db,
          "tripOperations",
          selectedOperation.id
        ),
        {
          accommodationAssignments:
            assignments,
          updatedBy: currentAdmin,
          updatedAt: new Date(),
        }
      );

      await reloadOperations();

      selectedOperation =
        operations.find(
          (operation) =>
            operation.id ===
            selectedOperation.id
        );

      renderAccommodation(
        pkgById(selectedOperation.packageId)
      );

      await openAccommodationGuestList();

      showGuestListNotice(
        `Slot released for ${bookingGuestName(booking)}. Inventory is now available again.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Release website slot error:",
        error
      );

      showGuestListNotice(
        "Failed to release the slot. Please check your connection and try again.",
        "error"
      );
    } finally {
      restoreButton();
    }
  }
  async function releaseWalkInSlot(
    reservationId,
    button = null
  ) {
    const found =
      findManualReservation(reservationId);

    if (!found) {
      showGuestListNotice(
        "Walk-in reservation was not found.",
        "error"
      );
      return;
    }

    if (
      !confirm(
        `Release slot for ${found.reservation.guestName}?`
      )
    ) {
      return;
    }

    const restoreButton =
      setRowActionLoading(
        button,
        "Releasing..."
      );

    try {
      const releasedRecord = {
        ...found.reservation,
        status: "released",
        releasedAt: new Date(),
        releasedBy: currentAdmin,
        releasedFromAccommodationId:
          found.accommodation.accommodationId || "",
        releasedFromAccommodationName:
          found.accommodation.name || "",
        releasedFromResortName:
          found.reservation.resortName ||
          accommodationResortName(found.accommodation),
      };

      // Physically remove the released reservation from ACTIVE inventory.
      const inventory =
        assignmentInventory().map(
          (item) => ({
            ...item,
            manualReservations:
              normalizeManualReservations(
                item
              ).filter(
                (reservation) =>
                  String(reservation.id) !==
                  String(reservationId) &&
                  String(
                    reservation.status || "active"
                  )
                    .trim()
                    .toLowerCase() !== "released"
              ),
          })
        );

      const releasedHistory = [
        ...normalizeReleasedAccommodationHistory(
          selectedOperation
        ),
        releasedRecord,
      ];

      await updateDoc(
        doc(
          db,
          "tripOperations",
          selectedOperation.id
        ),
        {
          accommodationAvailability:
            recalcManualInventory(
              inventory
            ),
          releasedAccommodationReservations:
            releasedHistory,
          updatedBy: currentAdmin,
          updatedAt: new Date(),
        }
      );

      await reloadOperations();

      selectedOperation =
        operations.find(
          (operation) =>
            operation.id ===
            selectedOperation.id
        );

      renderAccommodation(
        pkgById(selectedOperation.packageId)
      );

      await openAccommodationGuestList();

      showGuestListNotice(
        `Slot released for ${found.reservation.guestName}. The active record was removed and the slot is available again.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Release walk-in slot error:",
        error
      );

      showGuestListNotice(
        "Failed to release the slot. Please check your connection and try again.",
        "error"
      );
    } finally {
      restoreButton();
    }
  }

  async function cleanupLegacyReleasedWalkIns() {
    if (!selectedOperation) return false;

    const inventory = assignmentInventory();
    const legacyReleased = [];

    const cleanedInventory = inventory.map((item) => {
      const all =
        normalizeManualReservations(item);

      const released =
        all.filter(
          (reservation) =>
            String(
              reservation.status || ""
            )
              .trim()
              .toLowerCase() === "released"
        );

      released.forEach((reservation) => {
        legacyReleased.push({
          ...reservation,
          status: "released",
          releasedFromAccommodationId:
            item.accommodationId || "",
          releasedFromAccommodationName:
            item.name || "",
          releasedFromResortName:
            reservation.resortName ||
            accommodationResortName(item),
        });
      });

      return {
        ...item,
        manualReservations:
          all.filter(
            (reservation) =>
              String(
                reservation.status || "active"
              )
                .trim()
                .toLowerCase() !== "released"
          ),
      };
    });

    if (!legacyReleased.length) {
      return false;
    }

    const currentHistory =
      normalizeReleasedAccommodationHistory(
        selectedOperation
      );

    const seen = new Set(
      currentHistory.map(
        (record) =>
          String(record.id || "")
      )
    );

    const mergedHistory = [
      ...currentHistory,
      ...legacyReleased.filter(
        (record) =>
          !seen.has(String(record.id || ""))
      ),
    ];

    await updateDoc(
      doc(
        db,
        "tripOperations",
        selectedOperation.id
      ),
      {
        accommodationAvailability:
          recalcManualInventory(
            cleanedInventory
          ),
        releasedAccommodationReservations:
          mergedHistory,
        updatedBy: currentAdmin,
        updatedAt: new Date(),
      }
    );

    await reloadOperations();

    selectedOperation =
      operations.find(
        (operation) =>
          operation.id ===
          selectedOperation.id
      );

    renderAccommodation(
      pkgById(selectedOperation.packageId)
    );

    return true;
  }

  async function openAccommodationGuestList() {
    if (
      !selectedOperation ||
      !els.accommodationGuestListModal
    ) {
      return;
    }

    const button =
      els.btnGenerateAccommodationGuestList;

    const originalHTML = button?.innerHTML || "";

    if (button) {
      button.disabled = true;
      button.innerHTML = `
        <span class="btn-spinner"></span>
        Generating...
      `;
    }

    try {
      // Clean up old released records created by the earlier version.
      await cleanupLegacyReleasedWalkIns();

      // Gives Admin a clear visual confirmation that a fresh list
      // is being generated from the latest loaded schedule data.
      await new Promise((resolve) =>
        setTimeout(resolve, 320)
      );

      const packageItem =
      pkgById(selectedOperation.packageId);

    const inventory = Array.isArray(
      selectedOperation.accommodationAvailability
    )
      ? selectedOperation.accommodationAvailability
      : defaultInventory(packageItem);

    const scheduleBookings =
      opBookings(selectedOperation);

    const resortGroups = new Map();
    const assignedBookings = new Set();

    const ensureResort = (resortName) => {
      const key =
        String(resortName || "Unassigned Resort")
          .trim() || "Unassigned Resort";

      if (!resortGroups.has(key)) {
        resortGroups.set(key, {
          resortName: key,
          accommodations: [],
        });
      }

      return resortGroups.get(key);
    };

    inventory.forEach((accommodation) => {
      const resortName =
        accommodationResortName(accommodation);

      const websiteBookings =
        scheduleBookings.filter((booking) =>
          bookingAssignedToAccommodation(
            booking,
            accommodation,
            packageItem
          )
        );

      websiteBookings.forEach((booking) =>
        assignedBookings.add(booking.id)
      );

      const walkIns =
        activeManualReservations(
          accommodation
        );

      ensureResort(resortName)
        .accommodations.push({
          accommodation,
          websiteBookings,
          walkIns,
          websiteUnits:
            websiteBookings.reduce(
              (sum, booking) =>
                sum +
                bookingAssignedUnits(
                  booking,
                  accommodation
                ),
              0
            ),
          walkInUnits:
            walkIns.reduce(
              (sum, reservation) =>
                sum +
                Math.max(
                  1,
                  Number(reservation.units || 1)
                ),
              0
            ),
        });
    });

    const totalBookings =
      scheduleBookings.length;

    const totalGuests =
      scheduleBookings.reduce(
        (sum, booking) => sum + pax(booking),
        0
      );

    const totalWalkInUnits =
      inventory.reduce(
        (sum, accommodation) =>
          sum +
          activeManualReservations(
            accommodation
          ).reduce(
            (subtotal, reservation) =>
              subtotal +
              Math.max(
                1,
                Number(reservation.units || 1)
              ),
            0
          ),
        0
      );

    const unassignedBookings =
      scheduleBookings.filter(
        (booking) =>
          !assignedBookings.has(booking.id)
      );

    els.accommodationGuestListSubtitle.textContent =
      `${selectedOperation.packageName || packageItem?.name || "Tour"} · ` +
      `${selectedOperation.startDate || ""} - ${selectedOperation.endDate || ""}`;

    els.accommodationGuestListSummary.innerHTML = `
      <div>
        <span>Total Bookings</span>
        <strong>${totalBookings}</strong>
      </div>

      <div>
        <span>Total Guests</span>
        <strong>${totalGuests}</strong>
      </div>

      <div>
        <span>Walk-in Units</span>
        <strong>${totalWalkInUnits}</strong>
      </div>

      <div>
        <span>Unassigned</span>
        <strong>${unassignedBookings.length}</strong>
      </div>
    `;

    const resortSections =
      [...resortGroups.values()]
        .filter((resort) =>
          resort.accommodations.some(
            (group) =>
              group.websiteBookings.length ||
              group.walkIns.length
          )
        )
        .map((resort) => {
          const accommodationSections =
            resort.accommodations
              .filter(
                (group) =>
                  group.websiteBookings.length ||
                  group.walkIns.length
              )
              .map((group) => {
                const accommodation =
                  group.accommodation;

                const websiteRows =
                  group.websiteBookings.length
                    ? `
                      <div class="generated-source-block">
                        <div class="generated-source-title">
                          <i class="bi bi-globe2"></i>
                          Website Bookings
                          <span>
                            ${group.websiteUnits} unit${
                              group.websiteUnits === 1
                                ? ""
                                : "s"
                            }
                          </span>
                        </div>

                        ${group.websiteBookings
                          .map(
                            (booking, index) => {
                              const reference =
                                booking.bookingReference ||
                                booking.reference ||
                                booking.id;

                              const units =
                                bookingAssignedUnits(
                                  booking,
                                  accommodation
                                );

                              return `
                                <div class="generated-guest-row">
                                  <div class="generated-guest-number">
                                    ${index + 1}
                                  </div>

                                  <div class="generated-guest-person">
                                    <strong>
                                      ${esc(
                                        bookingGuestName(
                                          booking
                                        )
                                      )}
                                    </strong>

                                    <span>
                                      ${esc(reference)}
                                    </span>
                                  </div>

                                  <div class="generated-guest-pax">
                                    <strong>
                                      ${units}
                                      ${
                                        /tent/i.test(
                                          accommodation.name || ""
                                        )
                                          ? units === 1
                                            ? "tent"
                                            : "tents"
                                          : units === 1
                                            ? "unit"
                                            : "units"
                                      }
                                    </strong>

                                    <span>
                                      ${pax(booking)} pax
                                    </span>

                                    <div class="guest-row-actions">
                                      <button
                                        type="button"
                                        data-edit-website="${esc(booking.id)}"
                                      >
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        class="release"
                                        data-release-website="${esc(booking.id)}"
                                      >
                                        Release Slot
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              `;
                            }
                          )
                          .join("")}
                      </div>
                    `
                    : "";

                const walkInRows =
                  group.walkIns.length
                    ? `
                      <div class="generated-source-block walkin">
                        <div class="generated-source-title">
                          <i class="bi bi-person-walking"></i>
                          Walk-in / Resort
                          <span>
                            ${group.walkInUnits} unit${
                              group.walkInUnits === 1
                                ? ""
                                : "s"
                            }
                          </span>
                        </div>

                        ${group.walkIns
                          .map(
                            (reservation, index) => `
                              <div class="generated-guest-row">
                                <div class="generated-guest-number">
                                  ${index + 1}
                                </div>

                                <div class="generated-guest-person">
                                  <strong>
                                    ${esc(
                                      reservation.guestName
                                    )}
                                  </strong>

                                  <span>
                                    Walk-in / Manual
                                  </span>
                                </div>

                                <div class="generated-guest-pax">
                                  <strong>
                                    ${reservation.units}
                                    ${
                                      /tent/i.test(
                                        accommodation.name || ""
                                      )
                                        ? reservation.units === 1
                                          ? "tent"
                                          : "tents"
                                        : reservation.units === 1
                                          ? "unit"
                                          : "units"
                                    }
                                  </strong>

                                  <span>
                                    ${
                                      reservation.pax
                                        ? `${reservation.pax} pax`
                                        : "Pax not set"
                                    }
                                  </span>

                                  <div class="guest-row-actions">
                                    <button
                                      type="button"
                                      data-edit-walkin="${esc(reservation.id)}"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      class="release"
                                      data-release-walkin="${esc(reservation.id)}"
                                    >
                                      Release Slot
                                    </button>
                                  </div>
                                </div>
                              </div>
                            `
                          )
                          .join("")}
                      </div>
                    `
                    : "";

                return `
                  <section class="generated-guest-group">
                    <div class="generated-guest-group-head">
                      <div>
                        <h3>
                          ${esc(
                            accommodation.name ||
                              "Accommodation"
                          )}
                        </h3>

                        <p>
                          ${
                            group.websiteBookings.length
                          } website booking${
                            group.websiteBookings.length === 1
                              ? ""
                              : "s"
                          }
                          · ${group.walkInUnits} walk-in unit${
                            group.walkInUnits === 1
                              ? ""
                              : "s"
                          }
                        </p>
                      </div>

                      <span>
                        ${
                          Number(
                            accommodation.availableUnits ||
                              0
                          )
                        } remaining
                      </span>
                    </div>

                    <div class="generated-guest-table">
                      ${websiteRows}
                      ${walkInRows}
                    </div>
                  </section>
                `;
              })
              .join("");

          return `
            <section class="generated-resort-section">
              <div class="generated-resort-head">
                <div>
                  <i class="bi bi-buildings"></i>
                  <div>
                    <span>RESORT</span>
                    <h3>
                      ${esc(resort.resortName)}
                    </h3>
                  </div>
                </div>
              </div>

              ${accommodationSections}
            </section>
          `;
        });

    if (unassignedBookings.length) {
      resortSections.push(`
        <section class="generated-resort-section unassigned">
          <div class="generated-resort-head">
            <div>
              <i class="bi bi-exclamation-circle"></i>
              <div>
                <span>REVIEW</span>
                <h3>Unassigned Accommodation</h3>
              </div>
            </div>
          </div>

          <section class="generated-guest-group">
            <div class="generated-guest-table">
              ${unassignedBookings
                .map((booking, index) => {
                  const reference =
                    booking.bookingReference ||
                    booking.reference ||
                    booking.id;

                  return `
                    <div class="generated-guest-row">
                      <div class="generated-guest-number">
                        ${index + 1}
                      </div>

                      <div class="generated-guest-person">
                        <strong>
                          ${esc(
                            bookingGuestName(
                              booking
                            )
                          )}
                        </strong>

                        <span>
                          ${esc(reference)}
                        </span>
                      </div>

                      <div class="generated-guest-pax">
                        <strong>
                          ${pax(booking)} pax
                        </strong>

                        <span>
                          Needs assignment
                        </span>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </section>
        </section>
      `);
    }

    els.accommodationGuestListContent.innerHTML =
      resortSections.length
        ? resortSections.join("")
        : `
          <div class="generated-guest-empty">
            <i class="bi bi-people"></i>
            <strong>No accommodation assignments yet.</strong>
            <span>
              Website bookings and walk-in reservations will appear here.
            </span>
          </div>
        `;


    els.accommodationGuestListContent
      .querySelectorAll("[data-edit-website]")
      .forEach((button) =>
        button.addEventListener(
          "click",
          () =>
            openWebsiteAssignmentEditor(
              button.dataset.editWebsite
            )
        )
      );

    els.accommodationGuestListContent
      .querySelectorAll("[data-release-website]")
      .forEach((button) =>
        button.addEventListener(
          "click",
          () =>
            releaseWebsiteSlot(
              button.dataset.releaseWebsite,
              button
            )
        )
      );

    els.accommodationGuestListContent
      .querySelectorAll("[data-edit-walkin]")
      .forEach((button) =>
        button.addEventListener(
          "click",
          () =>
            openWalkInAssignmentEditor(
              button.dataset.editWalkin
            )
        )
      );

    els.accommodationGuestListContent
      .querySelectorAll("[data-release-walkin]")
      .forEach((button) =>
        button.addEventListener(
          "click",
          () =>
            releaseWalkInSlot(
              button.dataset.releaseWalkin,
              button
            )
        )
      );

    els.accommodationGuestListModal.classList.add(
      "show"
    );

    els.accommodationGuestListModal.setAttribute(
      "aria-hidden",
      "false"
    );

    } catch (error) {
      console.error("Generate Guest List error:", error);

      alert("Unable to generate the accommodation guest list.");
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    }
  }
  function closeAccommodationGuestList() {
    if (!els.accommodationGuestListModal) return;

    els.accommodationGuestListModal.classList.remove(
      "show"
    );

    els.accommodationGuestListModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  function renderAccommodation(packageItem) {
    const inventory = Array.isArray(
      selectedOperation.accommodationAvailability
    )
      ? selectedOperation.accommodationAvailability
      : defaultInventory(packageItem);

    const normalizedInventory = inventory.map((item) => {
      const defaultUnits = Math.max(
        0,
        Number(item.defaultUnits ?? item.availableUnits ?? 0) || 0
      );

      const websiteReserved = Math.max(
        0,
        Number(item.websiteReserved || 0)
      );

      const manualReservations =
        activeManualReservations(item);

      const manualReserved =
        manualReservations.reduce(
          (sum, reservation) =>
            sum +
            Math.max(
              1,
              Number(reservation.units || 1)
            ),
          0
        );

      const blockedUnits = Math.max(
        0,
        Number(item.blockedUnits || 0)
      );

      const maintenanceUnits = Math.max(
        0,
        Number(item.maintenanceUnits || 0)
      );

      // For legacy schedules, keep the previously saved availableUnits.
      // For new snapshots, remaining is calculated from the starting inventory.
      const calculatedRemaining = Math.max(
        0,
        defaultUnits -
          websiteReserved -
          manualReserved -
          blockedUnits -
          maintenanceUnits
      );

      const remaining =
        item.defaultUnits === undefined &&
        item.availableUnits !== undefined
          ? Math.max(0, Number(item.availableUnits || 0))
          : calculatedRemaining;

      const masterAccommodation =
        masterPackageAccommodation(
          item,
          packageItem
        );

      const masterDefaultUnits = Math.max(
        0,
        Number(
          masterAccommodation?.defaultAvailableUnits ??
          masterAccommodation?.defaultUnits ??
          0
        ) || 0
      );

      const effectiveDefaultUnits =
        (
          item.defaultUnits === undefined &&
          item.defaultAvailableUnits === undefined &&
          masterDefaultUnits > 0
        )
          ? masterDefaultUnits
          : defaultUnits;

      const effectiveRemaining = Math.max(
        0,
        effectiveDefaultUnits -
          websiteReserved -
          manualReserved -
          blockedUnits -
          maintenanceUnits
      );

      return {
        ...item,
        resortName:
          accommodationResortName(
            item,
            packageItem
          ),
        defaultUnits:
          effectiveDefaultUnits,
        defaultAvailableUnits:
          item.defaultAvailableUnits ??
          masterAccommodation?.defaultAvailableUnits ??
          masterAccommodation?.defaultUnits ??
          effectiveDefaultUnits,
        websiteReserved,
        manualReserved,
        manualReservations,
        blockedUnits,
        maintenanceUnits,
        availableUnits:
          (
            item.defaultUnits === undefined &&
            item.defaultAvailableUnits === undefined &&
            masterDefaultUnits > 0
          )
            ? effectiveRemaining
            : remaining,
      };
    });

    const totals = normalizedInventory.reduce(
      (summary, item) => {
        summary.defaultUnits += item.defaultUnits;
        summary.websiteReserved += item.websiteReserved;
        summary.manualReserved += item.manualReserved;
        summary.blockedUnits += item.blockedUnits;
        summary.maintenanceUnits += item.maintenanceUnits;
        summary.availableUnits += item.availableUnits;
        return summary;
      },
      {
        defaultUnits: 0,
        websiteReserved: 0,
        manualReserved: 0,
        blockedUnits: 0,
        maintenanceUnits: 0,
        availableUnits: 0,
      }
    );

    if (els.mAccommodationSummary) {
      els.mAccommodationSummary.innerHTML = normalizedInventory.length
        ? `
          <div>
            <span>Starting Units</span>
            <strong>${totals.defaultUnits}</strong>
          </div>

          <div>
            <span>Website Reserved</span>
            <strong>${totals.websiteReserved}</strong>
          </div>

          <div>
            <span>Manual / Walk-in</span>
            <strong>${totals.manualReserved}</strong>
          </div>

          <div>
            <span>Unavailable</span>
            <strong>${totals.blockedUnits + totals.maintenanceUnits}</strong>
          </div>

          <div class="available">
            <span>Remaining</span>
            <strong>${totals.availableUnits}</strong>
          </div>
        `
        : "";
    }

    if (!normalizedInventory.length) {
      els.mAccommodation.innerHTML =
        '<div class="empty">No accommodation configured for this package.</div>';
      return;
    }

    els.mAccommodation.innerHTML = normalizedInventory
      .map((item, index) => {
        const photo = item.mainPhoto || "";
        const price = Number(item.pricePerNight || 0);

        return `
          <article
            class="acc-monitor-card"
            data-acc-index="${index}"
          >
            <div class="acc-monitor-main">
              <div class="acc-photo-wrap">
                ${
                  photo
                    ? `
                      <img
                        class="acc-monitor-photo"
                        src="${esc(photo)}"
                        alt="${esc(item.name || "Accommodation")}"
                        onerror="this.parentElement.classList.add('photo-error'); this.remove();"
                      >
                    `
                    : ""
                }

                <div class="acc-photo-fallback">
                  <i class="bi bi-image"></i>
                  <span>No photo</span>
                </div>
              </div>

              <div class="acc-monitor-info">
                <div class="acc-monitor-title">
                  <div>
                    <h4>${esc(item.name || "Accommodation")}</h4>
                    <div class="acc-resort-name">
                      <i class="bi bi-buildings"></i>
                      ${esc(accommodationResortName(item))}
                    </div>
                    <p>
                      ${
                        price
                          ? `₱${price.toLocaleString("en-PH")} / night`
                          : "Included / no additional nightly rate"
                      }
                    </p>
                  </div>

                  <span
                    class="acc-remaining-badge ${
                      item.availableUnits > 0 ? "available" : "full"
                    }"
                  >
                    ${
                      item.availableUnits > 0
                        ? `${item.availableUnits} available`
                        : "Fully Booked"
                    }
                  </span>
                </div>

                <div class="acc-monitor-stats">
                  <div>
                    <span>Starting</span>
                    <strong>${item.defaultUnits}</strong>
                  </div>

                  <div>
                    <span>Website</span>
                    <strong>${item.websiteReserved}</strong>
                  </div>

                  <div>
                    <span>Walk-in</span>
                    <strong>${item.manualReserved}</strong>
                  </div>

                  <div>
                    <span>Blocked</span>
                    <strong>${item.blockedUnits}</strong>
                  </div>

                  <div>
                    <span>Maintenance</span>
                    <strong>${item.maintenanceUnits}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="acc-monitor-controls">
              <label>
                Blocked
                <input
                  class="acc-blocked"
                  type="number"
                  min="0"
                  step="1"
                  value="${item.blockedUnits}"
                >
              </label>

              <label>
                Maintenance
                <input
                  class="acc-maintenance"
                  type="number"
                  min="0"
                  step="1"
                  value="${item.maintenanceUnits}"
                >
              </label>

              <div class="acc-computed">
                <span>Remaining</span>
                <strong class="acc-remaining">
                  ${item.availableUnits}
                </strong>
              </div>

              <button
                type="button"
                class="btn btn-secondary acc-add-walkin"
                data-walkin-index="${index}"
              >
                <i class="bi bi-plus-lg"></i>
                Add Walk-in
              </button>
            </div>          </article>
        `;
      })
      .join("");

    // Recalculate remaining units immediately while Admin edits.
    els.mAccommodation
      .querySelectorAll(".acc-monitor-card")
      .forEach((card) => {
        const index = Number(card.dataset.accIndex);
        const item = normalizedInventory[index];

        const recalculate = () => {
          const blocked = Math.max(
            0,
            Number(card.querySelector(".acc-blocked")?.value || 0)
          );

          const maintenance = Math.max(
            0,
            Number(
              card.querySelector(".acc-maintenance")?.value || 0
            )
          );

          const remaining = Math.max(
            0,
            item.defaultUnits -
              item.websiteReserved -
              item.manualReserved -
              blocked -
              maintenance
          );

          const output = card.querySelector(".acc-remaining");

          if (output) {
            output.textContent = remaining;
          }
        };

        card
          .querySelectorAll(
            ".acc-blocked, .acc-maintenance"
          )
          .forEach((input) =>
            input.addEventListener("input", recalculate)
          );
      });

    els.mAccommodation
      .querySelectorAll(".acc-add-walkin")
      .forEach((button) => {
        button.addEventListener("click", () => {
          openWalkInModal(
            Number(button.dataset.walkinIndex)
          );
        });
      });
  }
  function renderGuests(bs){els.mGuestsList.innerHTML=bs.length?bs.map(b=>`<div class="list-row"><strong>${esc(b.customerName||b.fullName||b.name||'Customer')}</strong>${esc(b.bookingReference||b.reference||b.id)} · ${pax(b)} pax · ${esc(b.status||'Booking')}</div>`).join(''):'<div class="empty">No bookings yet for this schedule.</div>';}
  function renderActivity(){const audit=selectedOperation.accommodationAvailabilityAudit||selectedOperation.updatedBy||null;const items=[];if(selectedOperation.createdAt)items.push(`<div class="activity-item"><strong>Schedule created</strong><br>${esc(selectedOperation.createdBy?.name||'Admin')}</div>`);if(audit)items.push(`<div class="activity-item"><strong>Last availability / schedule update</strong><br>${esc(audit.name||selectedOperation.updatedBy?.name||'Admin')}</div>`);els.mActivity.innerHTML=items.join('')||'<div class="empty">No activity recorded yet.</div>';}
  function setTab(name){document.querySelectorAll('#manageTabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('#manageForm .tab-pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===name));}

  els.manageForm?.addEventListener('submit',async e=>{e.preventDefault();if(!selectedOperation)return;const current = Array.isArray(
      selectedOperation.accommodationAvailability
    )
      ? selectedOperation.accommodationAvailability
      : defaultInventory(
          pkgById(selectedOperation.packageId)
        );

    const updated = current.map((item, index) => {
      const card = els.mAccommodation.querySelector(
        `[data-acc-index="${index}"]`
      );

      const defaultUnits = Math.max(
        0,
        Number(item.defaultUnits ?? item.availableUnits ?? 0) || 0
      );

      const websiteReserved = Math.max(
        0,
        Number(item.websiteReserved || 0)
      );

      const manualReservations =
        normalizeManualReservations(item);

      const manualReserved =
        manualReservations.reduce(
          (sum, reservation) =>
            sum +
            Math.max(
              1,
              Number(reservation.units || 1)
            ),
          0
        );

      const blockedUnits = Math.max(
        0,
        Number(card?.querySelector(".acc-blocked")?.value || 0)
      );

      const maintenanceUnits = Math.max(
        0,
        Number(
          card?.querySelector(".acc-maintenance")?.value || 0
        )
      );

      const availableUnits = Math.max(
        0,
        defaultUnits -
          websiteReserved -
          manualReserved -
          blockedUnits -
          maintenanceUnits
      );

      return {
        ...item,
        defaultUnits,
        websiteReserved,
        manualReserved,
        manualReservations,
        blockedUnits,
        maintenanceUnits,
        availableUnits,
      };
    });const payload={bookingAvailability:els.mAvailability.value,status:els.mOperationStatus.value,day0PickupStart:els.mPickupTime.value,day0Note:els.mDepartureNote.value,vehicleName:els.mVehicle.value.trim(),vehiclePlate:els.mPlate.value.trim(),driverName:els.mDriver.value.trim(),driverContact:els.mDriverContact.value.trim(),coordinatorName:els.mCoordinator.value.trim(),coordinatorContact:els.mCoordinatorContact.value.trim(),announcement:els.mAnnouncement.value.trim(),accommodationAvailability:updated,accommodationAvailabilityAudit:{uid:currentAdmin.uid,name:currentAdmin.name,updatedAt:new Date()},updatedBy:currentAdmin,updatedAt:new Date()};showLoading?.('Saving schedule...');try{await updateDoc(doc(db,'tripOperations',selectedOperation.id),payload);await reloadOperations();selectedOperation=operations.find(o=>o.id===selectedOperation.id);hideLoading?.();showManage(selectedOperation.id);}catch(err){console.error(err);hideLoading?.();alert('Unable to save schedule.');}});

  els.createForm?.addEventListener('submit',async e=>{e.preventDefault();const p=pkgById(els.createPackage.value);if(!p)return;if(scheduleForDate(p.id,els.createStart.value)){alert('This package already has a schedule on the selected start date.');return;}showLoading?.('Creating schedule...');try{await addDoc(collection(db,'tripOperations'),buildOp(p,els.createStart.value,'custom',els.createEnd.value));await reloadOperations();closeModal(els.createModal);hideLoading?.();}catch(err){console.error(err);hideLoading?.();alert('Unable to create schedule.');}});
  els.createPackage?.addEventListener('change',()=>{const p=pkgById(els.createPackage.value);if(p&&els.createStart.value)els.createEnd.value=addDays(els.createStart.value,durationDays(p)-1);});
  els.createStart?.addEventListener('change',()=>{const p=pkgById(els.createPackage.value);if(p)els.createEnd.value=addDays(els.createStart.value,durationDays(p)-1);});
  els.grid?.addEventListener('click',e=>{const chip=e.target.closest('[data-op]');if(chip){showManage(chip.dataset.op);return;}const day=e.target.closest('[data-date]');if(day)showDate(day.dataset.date);});
  els.tourList?.addEventListener('click',e=>{const manage=e.target.closest('[data-manage]');if(manage)return showManage(manage.dataset.manage);const open=e.target.closest('[data-open-package]');if(open)return openRegular(open.dataset.openPackage);const custom=e.target.closest('[data-custom-package]');if(custom){els.createPackage.value=custom.dataset.customPackage;els.createStart.value=selectedDate;const p=pkgById(custom.dataset.customPackage);els.createEnd.value=addDays(selectedDate,durationDays(p)-1);closeModal(els.dateModal);openModal(els.createModal);}});
  els.tourSearch?.addEventListener('input',renderDateTours);
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close==='date'?els.dateModal:b.dataset.close==='manage'?els.manageModal:els.createModal)));
  $("prevMonthBtn")?.addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1,1);renderAll();});
  $("nextMonthBtn")?.addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1,1);renderAll();});
  $("todayBtn")?.addEventListener('click',()=>{const n=new Date();currentMonth=new Date(n.getFullYear(),n.getMonth(),1);renderAll();});
  $("customScheduleBtn")?.addEventListener('click',()=>{els.createForm.reset();openModal(els.createModal);});
  $("manageTabs")?.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)setTab(b.dataset.tab);});

  const requiredUiIds = [
    "calendarGrid",
    "calendarMonthLabel",
    "dateModal",
    "dateModalTitle",
    "tourSearch",
    "dateTourList",
    "manageModal",
    "manageForm",
    "createModal",
    "createForm",
    "createPackage",
    "createStart",
    "createEnd",
  ];

  const missingUiIds = requiredUiIds.filter(
    (id) => !document.getElementById(id)
  );

  if (missingUiIds.length) {
    console.warn(
      "TRIP OPERATIONS: Missing HTML elements:",
      missingUiIds
    );
  }

  loadData();

  els.btnGenerateAccommodationGuestList?.addEventListener(
    "click",
    openAccommodationGuestList
  );

  els.btnCloseAccommodationGuestList?.addEventListener(
    "click",
    closeAccommodationGuestList
  );

  els.accommodationGuestListModal
    ?.querySelectorAll(
      "[data-close-accommodation-guest-list]"
    )
    .forEach((element) =>
      element.addEventListener(
        "click",
        closeAccommodationGuestList
      )
    );



  els.btnCloseWalkInModal?.addEventListener(
    "click",
    closeWalkInModal
  );

  els.btnCancelWalkIn?.addEventListener(
    "click",
    closeWalkInModal
  );

  els.walkInReservationForm?.addEventListener(
    "submit",
    saveWalkInReservation
  );

  els.walkInReservationModal
    ?.querySelectorAll("[data-close-walkin-modal]")
    .forEach((element) =>
      element.addEventListener(
        "click",
        closeWalkInModal
      )
    );


  els.btnCloseAssignmentModal?.addEventListener(
    "click",
    closeAssignmentModal
  );

  els.btnCancelAssignment?.addEventListener(
    "click",
    closeAssignmentModal
  );

  els.accommodationAssignmentForm?.addEventListener(
    "submit",
    saveAccommodationAssignment
  );

  els.accommodationAssignmentModal
    ?.querySelectorAll("[data-close-assignment-modal]")
    .forEach((element) =>
      element.addEventListener(
        "click",
        closeAssignmentModal
      )
    );

  els.assignmentAccommodation?.addEventListener(
    "change",
    () => {
      const target =
        selectedAssignmentAccommodation();

      if (
        target &&
        (
          !els.assignmentResortName.value.trim() ||
          els.assignmentResortName.value ===
            "Unassigned Resort"
        )
      ) {
        const resort =
          accommodationResortName(target);

        els.assignmentResortName.value =
          resort === "Unassigned Resort"
            ? ""
            : resort;
      }
    }
  );

});
